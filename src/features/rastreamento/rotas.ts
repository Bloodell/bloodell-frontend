import type { Coordenada } from './modelo'

/**
 * Geometria das rotas. O backend so calcula distancia em linha reta (Haversine,
 * ver docs/escopo-grafo-rotas.md): nao existe geometria de ruas na API. Por isso
 * o trajeto vem de um servico de roteamento (OSRM) consultado pelo navegador.
 * O servidor publico do OSRM serve para demonstracao; em producao, aponte
 * NEXT_PUBLIC_ROUTING_URL para uma instancia propria (OSRM ou Valhalla).
 */
const URL_DE_ROTEAMENTO = process.env.NEXT_PUBLIC_ROUTING_URL ?? 'https://router.project-osrm.org/route/v1/driving'

export interface RotaObtida {
  coordenadas: Coordenada[]
  fonte: 'estradas' | 'estimada'
}

const memoria = new Map<string, Promise<RotaObtida>>()

const chave = (a: Coordenada, b: Coordenada) => `rota:${a.map((n) => n.toFixed(5))}>${b.map((n) => n.toFixed(5))}`

function lerDoArmazenamento(id: string): RotaObtida | null {
  try {
    const bruto = sessionStorage.getItem(id)
    return bruto ? (JSON.parse(bruto) as RotaObtida) : null
  } catch {
    return null
  }
}

function guardar(id: string, rota: RotaObtida) {
  try {
    sessionStorage.setItem(id, JSON.stringify(rota))
  } catch {
    // Sem armazenamento (aba anonima ou cota cheia): a memoria da sessao basta.
  }
}

/** Curva suave entre dois pontos, usada so quando nao ha servico de roteamento. */
export function curvaEstimada(origem: Coordenada, destino: Coordenada, passos = 64): Coordenada[] {
  const dx = destino[0] - origem[0]
  const dy = destino[1] - origem[1]
  // Controle deslocado para o lado: um arco em vez de uma reta, para nao fingir que e rua.
  const controle: Coordenada = [(origem[0] + destino[0]) / 2 - dy * 0.18, (origem[1] + destino[1]) / 2 + dx * 0.18]
  return Array.from({ length: passos + 1 }, (_, i) => {
    const t = i / passos
    const u = 1 - t
    return [
      u * u * origem[0] + 2 * u * t * controle[0] + t * t * destino[0],
      u * u * origem[1] + 2 * u * t * controle[1] + t * t * destino[1],
    ] as Coordenada
  })
}

async function consultar(origem: Coordenada, destino: Coordenada): Promise<RotaObtida> {
  const controlador = new AbortController()
  const limite = setTimeout(() => controlador.abort(), 9000)
  try {
    const resposta = await fetch(
      `${URL_DE_ROTEAMENTO}/${origem.join(',')};${destino.join(',')}?overview=full&geometries=geojson`,
      { signal: controlador.signal },
    )
    if (!resposta.ok) throw new Error(`roteamento ${resposta.status}`)
    const corpo = (await resposta.json()) as { routes?: { geometry: { coordinates: Coordenada[] } }[] }
    const coordenadas = corpo.routes?.[0]?.geometry.coordinates
    if (!coordenadas || coordenadas.length < 2) throw new Error('rota vazia')
    return { coordenadas, fonte: 'estradas' }
  } catch {
    return { coordenadas: curvaEstimada(origem, destino), fonte: 'estimada' }
  } finally {
    clearTimeout(limite)
  }
}

/** Rota por ruas entre origem e destino, com cache em memoria e na sessao. */
export function obterRota(origem: Coordenada, destino: Coordenada): Promise<RotaObtida> {
  const id = chave(origem, destino)
  const existente = memoria.get(id)
  if (existente) return existente

  const guardada = lerDoArmazenamento(id)
  const promessa = guardada
    ? Promise.resolve(guardada)
    : consultar(origem, destino).then((rota) => {
        // Rota estimada nao fica no cache da sessao: da proxima vez tenta de novo.
        if (rota.fonte === 'estradas') guardar(id, rota)
        else memoria.delete(id)
        return rota
      })
  memoria.set(id, promessa)
  return promessa
}
