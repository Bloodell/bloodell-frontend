'use client'

import maplibregl, { type GeoJSONSource, type Map as MapaGl, type Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { CamadaDeCaminhoes, type CaminhaoVisual } from './camada-de-caminhoes'
import { carregarEstilo, luzDoMapa, type TemaDoMapa } from './estilo-do-mapa'
import type { Coordenada, EntregaNoMapa, EstadoDoVeiculo, PontoDaRede } from './modelo'
import { estadoDoVeiculo } from './posicao'

export interface ComandosDoMapa {
  enquadrarRede: () => void
  enquadrarEntrega: (id: string) => void
  alternarInclinacao: () => void
  aproximar: () => void
  afastar: () => void
  norte: () => void
}

const CENTRO_INICIAL: Coordenada = [-34.9, -8.065]
const FAIXA_POR_PRIORIDADE: Record<string, number> = { EMERGENCIA: 0xa3152e, URGENTE: 0xc2610c, ELETIVA: 0x0e6a8c }

const COR_DA_ROTA = {
  claro: { nucleo: '#0b8fd9', brilho: '#38bdf8', fluxo: '#ffffff' },
  escuro: { nucleo: '#5cc8ff', brilho: '#38bdf8', fluxo: '#e6f6ff' },
}

const SVG_GOTA =
  '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M12 2.5c-.3 0-.6.1-.8.4C8.6 6.4 5.5 10.6 5.5 14.5a6.5 6.5 0 0 0 13 0c0-3.9-3.1-8.1-5.7-11.6a1 1 0 0 0-.8-.4Z"/></svg>'
const SVG_CRUZ =
  '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5V3Z"/></svg>'

function criarMarcador(ponto: PontoDaRede, destino: boolean): HTMLElement {
  const elemento = document.createElement('div')
  elemento.className = 'flex flex-col items-center gap-1 pointer-events-none'
  const hemocentro = ponto.tipo === 'HEMOCENTRO'
  const selo = document.createElement('span')
  selo.className = hemocentro
    ? 'flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-background'
    : 'flex size-7 items-center justify-center rounded-md bg-foreground text-background shadow-lg ring-2 ring-background'
  selo.innerHTML = hemocentro ? SVG_GOTA : SVG_CRUZ
  const rotulo = document.createElement('span')
  rotulo.textContent = ponto.nome
  rotulo.className =
    'max-w-40 truncate rounded-md border bg-card/90 px-1.5 py-0.5 text-apoio font-medium text-card-foreground shadow-sm backdrop-blur'
  rotulo.dataset.papel = destino ? 'destino' : 'origem'
  elemento.append(selo, rotulo)
  return elemento
}

/** Seta que fica deitada sobre a rota e aponta o sentido do deslocamento. */
function desenharSeta(tema: TemaDoMapa): ImageData {
  const tamanho = 32
  const tela = document.createElement('canvas')
  tela.width = tela.height = tamanho
  const ctx = tela.getContext('2d')!
  ctx.lineCap = ctx.lineJoin = 'round'
  ctx.lineWidth = 3.5
  ctx.strokeStyle = COR_DA_ROTA[tema].fluxo
  ctx.beginPath()
  ctx.moveTo(10, 8)
  ctx.lineTo(20, 16)
  ctx.lineTo(10, 24)
  ctx.stroke()
  return ctx.getImageData(0, 0, tamanho, tamanho)
}

function diferencaDeAngulo(de: number, para: number): number {
  return ((para - de + 540) % 360) - 180
}

interface PropriedadesDoMapa {
  entregas: EntregaNoMapa[]
  selecionadaId: string | null
  seguir: boolean
  tema: TemaDoMapa
  movimentoReduzido: boolean
  aoSelecionar: (id: string | null) => void
  aoPararDeSeguir: () => void
  aoAtualizar: (estados: Map<string, EstadoDoVeiculo>) => void
  aoPronto: () => void
  aoFalhar: (mensagem: string) => void
  aoMudarContexto: (perdido: boolean) => void
  comandos: Ref<ComandosDoMapa>
}

/**
 * Mapa isometrico da central logistica: MapLibre (base e rotas) + Three.js
 * (caminhoes) no mesmo contexto WebGL. O quadro a quadro vive em refs, nao em
 * estado do React: reconstruir a arvore 60 vezes por segundo seria desperdicio.
 */
export default function MapaLogistico(props: PropriedadesDoMapa) {
  const recipiente = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<MapaGl | null>(null)
  const camadaRef = useRef<CamadaDeCaminhoes | null>(null)
  const marcadoresRef = useRef(new Map<string, Marker>())
  const rumosRef = useRef(new Map<string, number>())
  const estadosRef = useRef(new Map<string, EstadoDoVeiculo>())
  const propsRef = useRef(props)
  const prontoRef = useRef(false)
  const conjuntoEnquadradoRef = useRef('')

  useEffect(() => {
    propsRef.current = props
  })

  // --- Comandos de camera expostos ao painel -------------------------------
  useImperativeHandle(
    props.comandos,
    () => ({
      enquadrarRede: () => {
        const mapa = mapaRef.current
        if (!mapa) return
        enquadrar(mapa, propsRef.current.entregas, null, propsRef.current.movimentoReduzido)
      },
      enquadrarEntrega: (id) => {
        const mapa = mapaRef.current
        if (!mapa) return
        enquadrar(mapa, propsRef.current.entregas, id, propsRef.current.movimentoReduzido)
      },
      alternarInclinacao: () => {
        const mapa = mapaRef.current
        if (!mapa) return
        const duracao = propsRef.current.movimentoReduzido ? 0 : 700
        mapa.easeTo({ pitch: mapa.getPitch() > 20 ? 0 : 58, duration: duracao })
      },
      aproximar: () => mapaRef.current?.zoomIn({ duration: propsRef.current.movimentoReduzido ? 0 : 300 }),
      afastar: () => mapaRef.current?.zoomOut({ duration: propsRef.current.movimentoReduzido ? 0 : 300 }),
      norte: () => mapaRef.current?.resetNorth({ duration: propsRef.current.movimentoReduzido ? 0 : 500 }),
    }),
  )

  // --- Criacao do mapa (uma vez) -------------------------------------------
  useEffect(() => {
    let cancelado = false
    let mapa: MapaGl | null = null
    let quadro = 0
    const marcadores = marcadoresRef.current

    const instalarCamadas = (m: MapaGl) => {
      const { tema, movimentoReduzido } = propsRef.current
      const cor = COR_DA_ROTA[tema]
      const primeiroSimbolo = m.getStyle().layers.find((camada) => camada.type === 'symbol')?.id

      if (!m.hasImage('seta-da-rota')) m.addImage('seta-da-rota', desenharSeta(tema))
      if (!m.getSource('rotas')) m.addSource('rotas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      if (!m.getSource('percorrido')) m.addSource('percorrido', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

      const ativa: unknown[] = ['==', ['get', 'selecionada'], 1]
      const camadas: Parameters<MapaGl['addLayer']>[0][] = [
        {
          id: 'rota-brilho',
          type: 'line',
          source: 'rotas',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': cor.brilho,
            'line-width': ['case', ativa, 16, 10] as never,
            'line-blur': 9,
            'line-opacity': ['case', ativa, 0.55, 0.3] as never,
          },
        },
        {
          id: 'rota-linha',
          type: 'line',
          source: 'rotas',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': cor.nucleo,
            'line-width': ['case', ativa, 5, 3.5] as never,
            'line-opacity': ['case', ativa, 0.5, 0.38] as never,
          },
        },
        {
          id: 'rota-percorrida',
          type: 'line',
          source: 'percorrido',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': cor.nucleo,
            'line-width': ['case', ativa, 5.5, 4] as never,
            'line-opacity': 1,
          },
        },
        {
          id: 'rota-fluxo',
          type: 'line',
          source: 'rotas',
          layout: { 'line-cap': 'butt' },
          paint: {
            'line-color': cor.fluxo,
            'line-width': 1.6,
            'line-opacity': movimentoReduzido ? 0 : 0.9,
            'line-dasharray': [0, 4, 3],
          },
        },
        {
          id: 'rota-setas',
          type: 'symbol',
          source: 'rotas',
          layout: {
            'symbol-placement': 'line',
            'symbol-spacing': 110,
            'icon-image': 'seta-da-rota',
            'icon-size': 0.62,
            'icon-allow-overlap': true,
            'icon-rotation-alignment': 'map',
            'icon-pitch-alignment': 'map',
          },
        },
      ]
      for (const camada of camadas) if (!m.getLayer(camada.id)) m.addLayer(camada, primeiroSimbolo)

      // Camada que os clicks acertam: a linha visivel e fina demais para o dedo.
      if (!m.getLayer('rota-alvo')) {
        m.addLayer(
          { id: 'rota-alvo', type: 'line', source: 'rotas', paint: { 'line-width': 22, 'line-opacity': 0 } },
          primeiroSimbolo,
        )
      }

      const camada = new CamadaDeCaminhoes({ animarAnel: !movimentoReduzido })
      camadaRef.current = camada
      if (m.getLayer(camada.id)) m.removeLayer(camada.id)
      m.addLayer(camada, primeiroSimbolo)
      m.setLight(luzDoMapa(tema))
      publicarRotas(m, propsRef.current)
    }

    carregarEstilo(propsRef.current.tema)
      .then((estilo) => {
        if (cancelado || !recipiente.current) return
        mapa = new maplibregl.Map({
          container: recipiente.current,
          style: estilo,
          center: CENTRO_INICIAL,
          zoom: 12.4,
          pitch: 58,
          bearing: -28,
          maxPitch: 78,
          minZoom: 9,
          maxZoom: 19,
          attributionControl: { compact: true },
          canvasContextAttributes: { antialias: true },
          fadeDuration: propsRef.current.movimentoReduzido ? 0 : 200,
        })
        mapaRef.current = mapa
        const m = mapa

        m.on('style.load', () => instalarCamadas(m))
        // "Pronto" = estilo carregado e camadas no lugar. Esperar o evento 'load' (todos os
        // tiles baixados) deixaria a tela bloqueada em conexoes lentas; os tiles aparecem aos poucos.
        m.once('style.load', () => {
          prontoRef.current = true
          propsRef.current.aoPronto()
          sincronizarMarcadores(m, marcadores, propsRef.current.entregas)
          const atuais = propsRef.current.entregas
          const conjunto = atuais.map((entrega) => entrega.id).join('|')
          // Se o usuario ja escolheu um veiculo antes do mapa ficar pronto, nao toma a camera dele.
          if (atuais.length && !propsRef.current.selecionadaId && conjunto !== conjuntoEnquadradoRef.current) {
            enquadrar(m, atuais, null, true)
          }
          conjuntoEnquadradoRef.current = conjunto
        })
        m.on('error', (evento) => {
          const mensagem = evento.error?.message ?? ''
          if (!prontoRef.current) propsRef.current.aoFalhar(mensagem || 'Falha ao carregar o mapa.')
        })

        const tela = m.getCanvas()
        // Ao desmontar, o proprio MapLibre derruba o contexto (liberar a GPU); isso nao e perda de verdade.
        tela.addEventListener('webglcontextlost', (evento) => {
          if (cancelado) return
          evento.preventDefault()
          propsRef.current.aoMudarContexto(true)
        })
        tela.addEventListener('webglcontextrestored', () => {
          if (cancelado) return
          propsRef.current.aoMudarContexto(false)
        })

        // Seleciona pelo veiculo (prioridade) ou pela rota; clicar no vazio limpa a selecao.
        m.on('click', (evento) => {
          const veiculo = camadaRef.current?.veiculoEm(evento.point)
          if (veiculo) return propsRef.current.aoSelecionar(veiculo)
          const rota = m.queryRenderedFeatures(evento.point, { layers: ['rota-alvo'] })[0]
          propsRef.current.aoSelecionar(rota ? String(rota.properties?.id) : null)
        })
        m.on('mousemove', (evento) => {
          const sobre =
            !!camadaRef.current?.veiculoEm(evento.point) ||
            m.queryRenderedFeatures(evento.point, { layers: ['rota-alvo'] }).length > 0
          m.getCanvas().style.cursor = sobre ? 'pointer' : ''
        })
        // Arrastar ou girar com a mao interrompe o modo "seguir".
        m.on('dragstart', () => propsRef.current.aoPararDeSeguir())
        m.on('rotatestart', (evento) => evento.originalEvent && propsRef.current.aoPararDeSeguir())

        iniciarQuadros(m)
      })
      .catch((falha: unknown) => {
        if (!cancelado) propsRef.current.aoFalhar(falha instanceof Error ? falha.message : 'Falha ao carregar o mapa.')
      })

    // --- Laco de animacao ---------------------------------------------------
    function iniciarQuadros(m: MapaGl) {
      let ultimoPercorrido = 0
      let ultimoRelato = 0
      let ultimoFluxo = 0
      let ultimoQuadroReduzido = 0
      let fase = 0

      const passo = (agora: number) => {
        quadro = requestAnimationFrame(passo)
        const atuais = propsRef.current
        const camada = camadaRef.current
        if (!camada || !m.getLayer(camada.id)) return

        const reduzido = atuais.movimentoReduzido
        // Movimento reduzido: a posicao ainda e informacao, entao atualiza 1x por segundo, sem interpolar.
        if (reduzido && agora - ultimoQuadroReduzido < 1000 && estadosRef.current.size) return
        if (reduzido) ultimoQuadroReduzido = agora

        const relogio = Date.now()
        const visuais: CaminhaoVisual[] = []
        for (const entrega of atuais.entregas) {
          const estado = estadoDoVeiculo(entrega, relogio)
          estadosRef.current.set(entrega.id, estado)
          const anterior = rumosRef.current.get(entrega.id) ?? estado.rumo
          const rumo = reduzido ? estado.rumo : (anterior + diferencaDeAngulo(anterior, estado.rumo) * 0.12 + 360) % 360
          rumosRef.current.set(entrega.id, rumo)
          visuais.push({
            id: entrega.id,
            coordenada: estado.coordenada,
            rumo,
            selecionado: entrega.id === atuais.selecionadaId,
            corDaFaixa: FAIXA_POR_PRIORIDADE[entrega.prioridade ?? 'ELETIVA'] ?? 0x0e6a8c,
          })
        }
        camada.definir(visuais)

        // Camera "seguir": acompanha o veiculo selecionado depois que o voo ate ele terminou
        // (jumpTo interrompe animacoes, entao nunca roda durante o easeTo da selecao).
        if (atuais.seguir && atuais.selecionadaId && !m.isEasing()) {
          const estado = estadosRef.current.get(atuais.selecionadaId)
          if (estado) m.jumpTo({ center: estado.coordenada })
        }

        if (agora - ultimoPercorrido > 250) {
          ultimoPercorrido = agora
          const fonte = m.getSource('percorrido') as GeoJSONSource | undefined
          fonte?.setData({
            type: 'FeatureCollection',
            features: atuais.entregas.map((entrega) => ({
              type: 'Feature',
              properties: { id: entrega.id, selecionada: entrega.id === atuais.selecionadaId ? 1 : 0 },
              geometry: {
                type: 'LineString',
                coordinates: entrega.trajeto.trechoAte(estadosRef.current.get(entrega.id)?.progresso ?? 0),
              },
            })),
          })
        }

        if (!reduzido && agora - ultimoFluxo > 70 && m.getLayer('rota-fluxo')) {
          ultimoFluxo = agora
          fase = (fase + 0.18) % 7
          // O pontilhado "anda" deslocando o inicio do padrao: indica o sentido da entrega.
          m.setPaintProperty('rota-fluxo', 'line-dasharray', [0, 7 - fase, 3, fase] as never)
        }

        if (agora - ultimoRelato > 1000) {
          ultimoRelato = agora
          atuais.aoAtualizar(new Map(estadosRef.current))
        }
      }
      quadro = requestAnimationFrame(passo)
    }

    return () => {
      cancelado = true
      cancelAnimationFrame(quadro)
      marcadores.forEach((marcador) => marcador.remove())
      marcadores.clear()
      mapa?.remove()
      mapaRef.current = null
      camadaRef.current = null
      prontoRef.current = false
    }
    // O mapa e criado uma unica vez; o resto chega por propsRef.
  }, [])

  // --- Dados que mudam: rotas, marcadores e selecao ------------------------
  const { entregas, selecionadaId, tema } = props
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !mapa.getSource('rotas')) return
    publicarRotas(mapa, { entregas, selecionadaId })
  }, [entregas, selecionadaId])

  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa) return
    sincronizarMarcadores(mapa, marcadoresRef.current, entregas)
    // Conjunto novo de entregas (primeira carga, ou troca API/simulacao): enquadra a rede toda.
    const conjunto = entregas.map((entrega) => entrega.id).join('|')
    if (prontoRef.current && conjunto && conjunto !== conjuntoEnquadradoRef.current) {
      conjuntoEnquadradoRef.current = conjunto
      enquadrar(mapa, entregas, null, propsRef.current.movimentoReduzido)
    }
  }, [entregas])

  // Selecionar um veiculo: a camera voa ate ele (ou pula, com movimento reduzido).
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || !selecionadaId) return
    const estado = estadosRef.current.get(selecionadaId)
    if (!estado) return
    const reduzido = propsRef.current.movimentoReduzido
    mapa.easeTo({
      center: estado.coordenada,
      zoom: Math.max(mapa.getZoom(), 15.4),
      pitch: Math.max(mapa.getPitch(), 55),
      duration: reduzido ? 0 : 900,
      easing: (t) => 1 - (1 - t) ** 3,
    })
  }, [selecionadaId])

  // Troca de tema: novo estilo; as camadas voltam no 'style.load'.
  const temaAnterior = useRef(tema)
  useEffect(() => {
    const mapa = mapaRef.current
    if (!mapa || temaAnterior.current === tema) return
    temaAnterior.current = tema
    carregarEstilo(tema)
      .then((estilo) => {
        if (mapaRef.current) mapaRef.current.setStyle(estilo, { diff: false })
      })
      .catch(() => propsRef.current.aoFalhar('Não foi possível trocar o tema do mapa.'))
  }, [tema])

  // O CSS do MapLibre forca `position: relative` no recipiente; por isso o
  // posicionamento absoluto fica no pai e o mapa ocupa 100% dele.
  return (
    <div className="absolute inset-0">
      <div ref={recipiente} className="size-full" role="application" aria-label="Mapa 3D da central logística" />
    </div>
  )
}

function publicarRotas(
  mapa: MapaGl,
  { entregas, selecionadaId }: { entregas: EntregaNoMapa[]; selecionadaId: string | null },
) {
  const fonte = mapa.getSource('rotas') as GeoJSONSource | undefined
  fonte?.setData({
    type: 'FeatureCollection',
    features: entregas.map((entrega) => ({
      type: 'Feature',
      properties: { id: entrega.id, selecionada: entrega.id === selecionadaId ? 1 : 0 },
      geometry: { type: 'LineString', coordinates: entrega.trajeto.coordenadas },
    })),
  })
}

function enquadrar(mapa: MapaGl, entregas: EntregaNoMapa[], id: string | null, semAnimacao: boolean) {
  const alvo = id ? entregas.filter((entrega) => entrega.id === id) : entregas
  if (!alvo.length) return
  const limites = new maplibregl.LngLatBounds()
  for (const entrega of alvo) entrega.trajeto.coordenadas.forEach((c) => limites.extend(c))
  mapa.fitBounds(limites, {
    padding: { top: 150, bottom: 70, left: 360, right: id ? 380 : 90 },
    pitch: 58,
    maxZoom: 16,
    duration: semAnimacao ? 0 : 1000,
  })
}

/** Mantem um marcador por hemocentro e hospital que aparece em alguma entrega. */
function sincronizarMarcadores(mapa: MapaGl, existentes: Map<string, Marker>, entregas: EntregaNoMapa[]) {
  const necessarios = new Map<string, { ponto: PontoDaRede; destino: boolean }>()
  for (const entrega of entregas) {
    necessarios.set(`o-${entrega.origem.id}`, { ponto: entrega.origem, destino: false })
    necessarios.set(`d-${entrega.destino.id}`, { ponto: entrega.destino, destino: true })
  }
  for (const [id, marcador] of existentes) {
    if (!necessarios.has(id)) {
      marcador.remove()
      existentes.delete(id)
    }
  }
  for (const [id, { ponto, destino }] of necessarios) {
    if (existentes.has(id)) continue
    existentes.set(
      id,
      new maplibregl.Marker({ element: criarMarcador(ponto, destino), anchor: 'bottom' }).setLngLat(ponto.coordenada).addTo(mapa),
    )
  }
}
