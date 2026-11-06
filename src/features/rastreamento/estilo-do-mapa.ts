import type { StyleSpecification } from 'maplibre-gl'

/**
 * Base cartografica: OpenFreeMap (tiles vetoriais OpenMapTiles, sem chave de
 * API), com o estilo "liberty" reestilizado aqui. A base e a "paisagem" e as
 * nossas rotas e veiculos sao a "figura": por isso as cores da base sao
 * dessaturadas e frias, e so os dados da operacao tem saturacao.
 *
 * O mesmo estilo serve aos dois temas da interface; so a paleta muda.
 */
const URL_DO_ESTILO = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? 'https://tiles.openfreemap.org/styles/liberty'

export type TemaDoMapa = 'claro' | 'escuro'

interface Paleta {
  fundo: string
  moradia: string
  parque: string
  mata: string
  grama: string
  agua: string
  via: string
  viaPrincipal: string
  contornoDaVia: string
  trilho: string
  predioBaixo: string
  predioAlto: string
  rotulo: string
  halo: string
  limite: string
}

const PALETAS: Record<TemaDoMapa, Paleta> = {
  claro: {
    fundo: '#eef1f6',
    moradia: '#e8ebf2',
    parque: '#d6e7da',
    mata: '#cfe2d4',
    grama: '#dcebdf',
    agua: '#c5d5e6',
    via: '#ffffff',
    viaPrincipal: '#ffffff',
    contornoDaVia: '#cdd3df',
    trilho: '#c2c8d6',
    predioBaixo: '#e3e6ee',
    predioAlto: '#c3c9d9',
    rotulo: '#4a5266',
    halo: 'rgba(255,255,255,0.85)',
    limite: '#b9c0d0',
  },
  escuro: {
    fundo: '#12141c',
    moradia: '#161923',
    parque: '#16251d',
    mata: '#14221a',
    grama: '#182720',
    agua: '#0f2030',
    via: '#2f3547',
    viaPrincipal: '#394058',
    contornoDaVia: '#0e1017',
    trilho: '#252a37',
    predioBaixo: '#2c3248',
    predioAlto: '#4d5776',
    rotulo: '#c4cad9',
    halo: 'rgba(10,12,18,0.8)',
    limite: '#3a4152',
  },
}

let estiloBruto: Promise<StyleSpecification> | null = null

function baixarEstilo(): Promise<StyleSpecification> {
  estiloBruto ??= fetch(URL_DO_ESTILO).then((resposta) => {
    if (!resposta.ok) throw new Error(`Estilo do mapa indisponivel (${resposta.status})`)
    return resposta.json() as Promise<StyleSpecification>
  })
  // Falha nao fica em cache: a proxima tentativa busca de novo.
  estiloBruto.catch(() => (estiloBruto = null))
  return estiloBruto
}

type Camada = StyleSpecification['layers'][number] & { paint?: Record<string, unknown>; layout?: Record<string, unknown> }

export async function carregarEstilo(tema: TemaDoMapa): Promise<StyleSpecification> {
  const p = PALETAS[tema]
  const estilo = structuredClone(await baixarEstilo())

  estilo.layers = (estilo.layers as Camada[]).flatMap((camada) => {
    const { id, type } = camada
    const paint = (camada.paint ??= {})
    const layout = (camada.layout ??= {})

    if (type === 'background') {
      paint['background-color'] = p.fundo
    } else if (type === 'raster') {
      return [] // relevo de baixa resolucao do Natural Earth: ruido para o nosso fundo
    } else if (id === 'park' || id === 'park_outline') {
      if (type === 'fill') paint['fill-color'] = p.parque
      else paint['line-color'] = p.parque
    } else if (id === 'landcover_wood') {
      paint['fill-color'] = p.mata
    } else if (id === 'landcover_grass') {
      paint['fill-color'] = p.grama
    } else if (id === 'landuse_residential') {
      paint['fill-color'] = p.moradia
    } else if (id.startsWith('landuse_') || id.startsWith('landcover_')) {
      if (type === 'fill') paint['fill-color'] = p.moradia
    } else if (id === 'road_area_pattern') {
      paint['fill-opacity'] = 0.25
    } else if (id.startsWith('aeroway_')) {
      if (type === 'fill') paint['fill-color'] = p.moradia
      else paint['line-color'] = p.contornoDaVia
    } else if (id === 'water' || id === 'landcover_sand') {
      paint['fill-color'] = id === 'water' ? p.agua : p.moradia
    } else if (id.startsWith('waterway_') && type === 'line') {
      paint['line-color'] = p.agua
    } else if (/^(road|bridge|tunnel)_/.test(id) && type === 'line') {
      if (id.includes('rail')) {
        paint['line-color'] = p.trilho
      } else if (id.includes('casing')) {
        paint['line-color'] = p.contornoDaVia
      } else if (id.includes('path') || id.includes('pedestrian')) {
        paint['line-color'] = p.contornoDaVia
      } else {
        paint['line-color'] = /motorway|trunk|primary/.test(id) ? p.viaPrincipal : p.via
        paint['line-opacity'] = 1
      }
    } else if (id === 'building') {
      paint['fill-color'] = p.predioBaixo
      paint['fill-outline-color'] = p.contornoDaVia
    } else if (id === 'building-3d') {
      camada.minzoom = 13.5
      paint['fill-extrusion-color'] = [
        'interpolate',
        ['linear'],
        ['coalesce', ['get', 'render_height'], 6],
        0,
        p.predioBaixo,
        60,
        p.predioAlto,
      ]
      paint['fill-extrusion-opacity'] = 0.96
      paint['fill-extrusion-vertical-gradient'] = true
    } else if (id.startsWith('boundary')) {
      paint['line-color'] = p.limite
    } else if (type === 'symbol') {
      // Pontos de interesse, escudos de rodovia e setas de mao unica: ruido para quem
      // acompanha entregas. Os rotulos de rua, bairro e agua ficam.
      if (id.startsWith('poi_') || id.includes('shield') || id.includes('one_way') || id === 'airport') return []
      paint['text-color'] = p.rotulo
      paint['text-halo-color'] = p.halo
      paint['text-halo-width'] = 1.2
      layout['text-size'] = layout['text-size'] ?? 12
    }
    return [camada]
  }) as StyleSpecification['layers']

  return estilo
}

/** Luz que da volume aos predios extrudados (direcao de cima, de um dos lados). */
export function luzDoMapa(tema: TemaDoMapa) {
  return {
    anchor: 'viewport' as const,
    color: tema === 'claro' ? '#ffffff' : '#9aa4d6',
    intensity: tema === 'claro' ? 0.42 : 0.3,
    position: [1.4, 210, 45] as [number, number, number],
  }
}
