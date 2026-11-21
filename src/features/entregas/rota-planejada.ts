/**
 * Rota que o backend grava ao roteirizar (POST /entregas/{id}/roteirizacao):
 *   {"paradas":[{ordem,tipo,unidadeId,nome,latitude,longitude}, ...]}
 * O campo `rota` aceita qualquer JSON, entao nada garante esse formato: tudo
 * e validado antes de usar, e o que nao casa vira "rota indisponivel".
 */
export interface ParadaRota {
  ordem: number
  tipo: string
  unidadeId: number
  nome: string
  latitude: number
  longitude: number
}

export interface RotaPlanejada {
  paradas: ParadaRota[]
}

function ehParada(valor: unknown): valor is ParadaRota {
  if (typeof valor !== 'object' || valor === null) return false
  const p = valor as Record<string, unknown>
  return (
    Number.isInteger(p.ordem) &&
    typeof p.tipo === 'string' &&
    Number.isInteger(p.unidadeId) &&
    typeof p.nome === 'string' &&
    typeof p.latitude === 'number' &&
    Number.isFinite(p.latitude) &&
    Math.abs(p.latitude) <= 90 &&
    typeof p.longitude === 'number' &&
    Number.isFinite(p.longitude) &&
    Math.abs(p.longitude) <= 180
  )
}

export function interpretarRota(rota: string | null | undefined): RotaPlanejada | null {
  if (!rota) return null
  let documento: unknown
  try {
    documento = JSON.parse(rota)
  } catch {
    return null
  }
  if (typeof documento !== 'object' || documento === null || !Array.isArray((documento as { paradas?: unknown }).paradas)) return null
  const paradas = (documento as { paradas: unknown[] }).paradas
  if (paradas.length < 2 || !paradas.every(ehParada)) return null
  return { paradas: [...paradas].sort((a, b) => a.ordem - b.ordem) }
}
