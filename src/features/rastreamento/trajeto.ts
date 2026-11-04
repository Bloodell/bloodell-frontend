import bearing from '@turf/bearing'
import { lineString, point } from '@turf/helpers'
import length from '@turf/length'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import type { Coordenada } from './modelo'

const RAIO_DA_TERRA_KM = 6371.0088
const rad = (graus: number) => (graus * Math.PI) / 180

function haversineKm(a: Coordenada, b: Coordenada): number {
  const dLat = rad(b[1] - a[1])
  const dLon = rad(b[0] - a[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2
  return 2 * RAIO_DA_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Uma rota como linha geografica: sabe o comprimento, devolve o ponto e o rumo
 * em qualquer fracao do percurso (para animar o veiculo) e projeta uma posicao
 * qualquer sobre ela (para converter telemetria em progresso).
 */
export class Trajeto {
  readonly coordenadas: Coordenada[]
  readonly comprimentoKm: number
  private readonly acumulado: number[]

  constructor(coordenadas: Coordenada[]) {
    this.coordenadas = coordenadas
    this.acumulado = [0]
    for (let i = 1; i < coordenadas.length; i++) {
      this.acumulado.push(this.acumulado[i - 1] + haversineKm(coordenadas[i - 1], coordenadas[i]))
    }
    // Turf como fonte unica do comprimento; o acumulado serve para interpolar.
    this.comprimentoKm = coordenadas.length > 1 ? length(lineString(coordenadas), { units: 'kilometers' }) : 0
  }

  private indiceDoSegmento(distanciaKm: number): number {
    let baixo = 0
    let alto = this.acumulado.length - 1
    while (alto - baixo > 1) {
      const meio = (baixo + alto) >> 1
      if (this.acumulado[meio] <= distanciaKm) baixo = meio
      else alto = meio
    }
    return baixo
  }

  private coordenadaEm(distanciaKm: number): Coordenada {
    const total = this.acumulado[this.acumulado.length - 1]
    const d = Math.min(Math.max(distanciaKm, 0), total)
    const i = this.indiceDoSegmento(d)
    const a = this.coordenadas[i]
    const b = this.coordenadas[Math.min(i + 1, this.coordenadas.length - 1)]
    const trecho = this.acumulado[i + 1] - this.acumulado[i]
    const t = trecho > 0 ? (d - this.acumulado[i]) / trecho : 0
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  }

  /** Ponto e rumo (graus a partir do norte, sentido horario) numa fracao 0-1 do percurso. */
  pontoEm(fracao: number): { coordenada: Coordenada; rumo: number } {
    const total = this.acumulado[this.acumulado.length - 1]
    const d = Math.min(Math.max(fracao, 0), 1) * total
    const coordenada = this.coordenadaEm(d)
    // O rumo olha 60 m a frente: curvas ficam suaves em vez de girar a cada vertice.
    const olhar = 0.06
    const [de, para] =
      d + olhar <= total
        ? [coordenada, this.coordenadaEm(d + olhar)]
        : [this.coordenadaEm(Math.max(0, total - olhar)), this.coordenadaEm(total)]
    return { coordenada, rumo: (bearing(point(de), point(para)) + 360) % 360 }
  }

  /** Trecho ja percorrido, como lista de coordenadas (da origem ate a fracao). */
  trechoAte(fracao: number): Coordenada[] {
    const total = this.acumulado[this.acumulado.length - 1]
    const d = Math.min(Math.max(fracao, 0), 1) * total
    const i = this.indiceDoSegmento(d)
    return [...this.coordenadas.slice(0, i + 1), this.coordenadaEm(d)]
  }

  /** Fracao do percurso mais proxima de uma coordenada, e a distancia ate a rota (km). */
  projetar(coordenada: Coordenada): { fracao: number; desvioKm: number } {
    const mais = nearestPointOnLine(lineString(this.coordenadas), point(coordenada), { units: 'kilometers' })
    const total = this.acumulado[this.acumulado.length - 1]
    const noTrecho = (mais.properties.location as number) ?? 0
    return { fracao: total > 0 ? Math.min(1, noTrecho / total) : 0, desvioKm: (mais.properties.dist as number) ?? 0 }
  }
}
