import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  RingGeometry,
  type BufferGeometry,
  type Material,
} from 'three'

/**
 * Caminhao refrigerado, procedural e de poucos poligonos (cerca de 60 triangulos):
 * leve de carregar (nao ha arquivo GLB para baixar) e facil de recolorir. As
 * medidas sao em metros, com Z para cima e a frente voltada para +Y; a camada
 * ajusta a escala e o giro.
 *
 * Cor da cabine = marca (violeta). Faixa lateral = prioridade da requisicao.
 */

const geometrias = {
  chassi: new BoxGeometry(2.3, 7.5, 0.55),
  carga: new BoxGeometry(2.6, 4.9, 2.8),
  tetoDaCarga: new BoxGeometry(2.66, 4.96, 0.16),
  faixa: new BoxGeometry(0.08, 4.5, 0.6),
  cabine: new BoxGeometry(2.5, 2.1, 2.2),
  parabrisa: new BoxGeometry(2.3, 0.12, 0.95),
  roda: new CylinderGeometry(0.62, 0.62, 0.42, 14),
  farol: new BoxGeometry(0.5, 0.1, 0.28),
  sombra: new BoxGeometry(3.1, 8.2, 0.02),
}

const materiais = {
  chassi: new MeshLambertMaterial({ color: '#2a2e3b' }),
  carga: new MeshLambertMaterial({ color: '#f3f5fa' }),
  teto: new MeshLambertMaterial({ color: '#d7dbe6' }),
  cabine: new MeshLambertMaterial({ color: '#6a4cf5' }),
  vidro: new MeshLambertMaterial({ color: '#1b2233' }),
  roda: new MeshLambertMaterial({ color: '#15171d' }),
  farol: new MeshBasicMaterial({ color: '#fff4c2' }),
  sombra: new MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.2, depthWrite: false }),
}

const materiaisDeFaixa = new Map<number, MeshLambertMaterial>()
function materialDaFaixa(cor: number) {
  let material = materiaisDeFaixa.get(cor)
  if (!material) {
    material = new MeshLambertMaterial({ color: cor })
    materiaisDeFaixa.set(cor, material)
  }
  return material
}

function peca(geometria: BufferGeometry, material: Material, x: number, y: number, z: number) {
  const malha = new Mesh(geometria, material)
  malha.position.set(x, y, z)
  return malha
}

export function criarCaminhao(corDaFaixa: number): Group {
  const caminhao = new Group()

  caminhao.add(peca(geometrias.sombra, materiais.sombra, 0, 0, 0.02))
  caminhao.add(peca(geometrias.chassi, materiais.chassi, 0, 0, 0.85))
  caminhao.add(peca(geometrias.carga, materiais.carga, 0, -1.2, 2.55))
  caminhao.add(peca(geometrias.tetoDaCarga, materiais.teto, 0, -1.2, 4.03))
  caminhao.add(peca(geometrias.cabine, materiais.cabine, 0, 3.0, 2.05))
  caminhao.add(peca(geometrias.parabrisa, materiais.vidro, 0, 4.06, 2.65))

  const faixa = materialDaFaixa(corDaFaixa)
  for (const lado of [-1, 1]) {
    caminhao.add(peca(geometrias.faixa, faixa, lado * 1.3, -1.2, 2.0))
    caminhao.add(peca(geometrias.farol, materiais.farol, lado * 0.8, 4.07, 1.35))
  }

  for (const y of [3.0, -1.7, -3.0]) {
    for (const lado of [-1, 1]) {
      const roda = peca(geometrias.roda, materiais.roda, lado * 1.15, y, 0.62)
      roda.rotation.z = Math.PI / 2
      caminhao.add(roda)
    }
  }

  return caminhao
}

/** Anel de selecao no chao, em volta do veiculo escolhido. */
export function criarAnelDeSelecao(cor: number): Mesh {
  const anel = new Mesh(
    new RingGeometry(5.6, 6.6, 48),
    new MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.95, depthWrite: false, side: DoubleSide }),
  )
  return anel
}
