import { Camera, DirectionalLight, Group, HemisphereLight, Matrix4, Mesh, Scene, WebGLRenderer } from 'three'
import { MercatorCoordinate, type CustomLayerInterface, type CustomRenderMethodInput, type Map as MapaGl } from 'maplibre-gl'
import { criarAnelDeSelecao, criarCaminhao } from './caminhao-3d'
import type { Coordenada } from './modelo'

export interface CaminhaoVisual {
  id: string
  coordenada: Coordenada
  /** Graus a partir do norte, sentido horario. */
  rumo: number
  selecionado: boolean
  /** Cor da faixa lateral (prioridade), em 0xRRGGBB. */
  corDaFaixa: number
}

/** Tamanho aparente constante: em metros reais o caminhao teria 2 px no zoom da cidade. */
function escalaVisual(zoom: number): number {
  return 9 * 2 ** ((16 - zoom) * 0.85)
}

/**
 * Camada customizada do MapLibre que desenha os caminhoes com Three.js no
 * mesmo contexto WebGL do mapa (e no mesmo buffer de profundidade: os
 * predios 3D passam na frente dos veiculos quando deveriam).
 *
 * Cada veiculo e desenhado com a sua propria matriz: a coordenada Mercator
 * tem escala de 1e-7 por metro, e somar isso a um unico mundo em float32
 * faria os modelos tremerem.
 */
export class CamadaDeCaminhoes implements CustomLayerInterface {
  readonly id = 'caminhoes-3d'
  readonly type = 'custom' as const
  readonly renderingMode = '3d' as const

  private mapa: MapaGl | null = null
  private renderer: WebGLRenderer | null = null
  private cena = new Scene()
  private camera = new Camera()
  private modelos = new Map<string, { grupo: Group; faixa: number }>()
  private anel: Mesh | null = null
  private veiculos: CaminhaoVisual[] = []
  private relogio = 0
  private animarAnel = true

  constructor(opcoes: { animarAnel: boolean }) {
    this.animarAnel = opcoes.animarAnel
    this.cena.add(new HemisphereLight('#ffffff', '#8b93b5', 2.1))
    const sol = new DirectionalLight('#ffffff', 2.4)
    sol.position.set(-0.5, -0.7, 1)
    this.cena.add(sol)
  }

  onAdd(mapa: MapaGl, gl: WebGLRenderingContext | WebGL2RenderingContext) {
    this.mapa = mapa
    // Idempotente: apos uma perda de contexto WebGL o MapLibre chama onAdd de novo.
    this.renderer?.dispose()
    this.renderer = new WebGLRenderer({ canvas: mapa.getCanvas(), context: gl, antialias: true })
    this.renderer.autoClear = false
    this.modelos.forEach(({ grupo }) => this.cena.remove(grupo))
    this.modelos.clear()
    if (this.anel) this.cena.remove(this.anel)
    this.anel = null
  }

  onRemove() {
    this.modelos.forEach(({ grupo }) => this.cena.remove(grupo))
    this.modelos.clear()
    if (this.anel) this.cena.remove(this.anel)
    this.anel = null
    this.renderer?.dispose()
    this.renderer = null
    this.mapa = null
  }

  /** Atualiza a posicao dos veiculos (chamado a cada quadro pelo componente do mapa). */
  definir(veiculos: CaminhaoVisual[]) {
    this.veiculos = veiculos
    this.mapa?.triggerRepaint()
  }

  /** Veiculo mais proximo de um ponto da tela, dentro de um raio em pixels. */
  veiculoEm(ponto: { x: number; y: number }, raioPx = 34): string | null {
    if (!this.mapa) return null
    let melhor: { id: string; distancia: number } | null = null
    for (const veiculo of this.veiculos) {
      const tela = this.mapa.project(veiculo.coordenada)
      const distancia = Math.hypot(tela.x - ponto.x, tela.y - ponto.y)
      if (distancia <= raioPx && (!melhor || distancia < melhor.distancia)) melhor = { id: veiculo.id, distancia }
    }
    return melhor?.id ?? null
  }

  render(_gl: WebGLRenderingContext | WebGL2RenderingContext, entrada: CustomRenderMethodInput) {
    const renderer = this.renderer
    const mapa = this.mapa
    if (!renderer || !mapa) return

    const zoom = mapa.getZoom()
    // mainMatrix leva coordenadas Mercator (0 a 1) ao espaco de recorte.
    const mundoParaTela = new Matrix4().fromArray(entrada.defaultProjectionData.mainMatrix as unknown as number[])

    const idsAtuais = new Set(this.veiculos.map((v) => v.id))
    for (const [id, { grupo }] of this.modelos) {
      if (!idsAtuais.has(id)) {
        this.cena.remove(grupo)
        this.modelos.delete(id)
      }
    }

    renderer.resetState()
    this.relogio += 1
    const pulso = this.animarAnel ? 1 + 0.08 * Math.sin(this.relogio / 14) : 1

    // Veiculos mais ao fundo primeiro: a ordem de pintura ajuda onde a transparencia se sobrepoe.
    const desenhar = [...this.veiculos].sort((a, b) => b.coordenada[1] - a.coordenada[1] + 0)

    for (const veiculo of desenhar) {
      let modelo = this.modelos.get(veiculo.id)
      if (!modelo || modelo.faixa !== veiculo.corDaFaixa) {
        if (modelo) this.cena.remove(modelo.grupo)
        const grupo = criarCaminhao(veiculo.corDaFaixa)
        grupo.matrixAutoUpdate = false
        modelo = { grupo, faixa: veiculo.corDaFaixa }
        this.modelos.set(veiculo.id, modelo)
        this.cena.add(grupo)
      }

      const mercator = MercatorCoordinate.fromLngLat(veiculo.coordenada, 0)
      const metro = mercator.meterInMercatorCoordinateUnits()
      const escala = metro * escalaVisual(zoom) * (veiculo.selecionado ? 1.2 : 1)

      // Escala com Y invertido (Mercator cresce para o sul) e giro pelo rumo.
      // O determinante negativo faz o Three inverter o sentido das faces sozinho.
      const local = new Matrix4()
        .makeScale(escala, -escala, escala)
        .multiply(new Matrix4().makeRotationZ((-veiculo.rumo * Math.PI) / 180))
      modelo.grupo.matrix.copy(local)
      modelo.grupo.matrixWorld.copy(local)
      modelo.grupo.matrixWorldNeedsUpdate = false

      this.camera.projectionMatrix = mundoParaTela
        .clone()
        .multiply(new Matrix4().makeTranslation(mercator.x, mercator.y, mercator.z))
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert()

      // Um veiculo por vez: so o grupo atual fica visivel nesta passada.
      this.modelos.forEach(({ grupo }) => (grupo.visible = grupo === modelo.grupo))
      if (this.anel) this.anel.visible = false

      if (veiculo.selecionado) {
        if (!this.anel) {
          this.anel = criarAnelDeSelecao(0xa894ff)
          this.anel.matrixAutoUpdate = false
          this.cena.add(this.anel)
        }
        this.anel.visible = true
        // O anel flutua 0,8 m acima do chao: colado em z=0 ele perde o teste de profundidade para o mapa.
        const aneis = local.clone().multiply(new Matrix4().makeTranslation(0, 0, 0.8)).multiply(new Matrix4().makeScale(pulso, pulso, 1))
        this.anel.matrix.copy(aneis)
        this.anel.matrixWorld.copy(aneis)
      }

      renderer.render(this.cena, this.camera)
    }

    renderer.resetState()
  }
}
