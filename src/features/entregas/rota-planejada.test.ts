import { describe, expect, it } from 'vitest'
import { interpretarRota } from './rota-planejada'

const ORIGEM = { ordem: 0, tipo: 'HEMOCENTRO', unidadeId: 10, nome: 'Hemope', latitude: -8.05, longitude: -34.9 }
const DESTINO = { ordem: 1, tipo: 'HOSPITAL', unidadeId: 20, nome: 'HR', latitude: -8.06, longitude: -34.88 }

describe('interpretarRota', () => {
  it('le_paradas_do_backend_em_ordem', () => {
    const rota = interpretarRota(JSON.stringify({ paradas: [DESTINO, ORIGEM] }))
    expect(rota?.paradas.map((parada) => parada.nome)).toEqual(['Hemope', 'HR'])
  })

  it('json_invalido_ou_outro_formato_vira_null', () => {
    expect(interpretarRota(null)).toBeNull()
    expect(interpretarRota('{quebrado')).toBeNull()
    expect(interpretarRota('[]')).toBeNull()
    expect(interpretarRota(JSON.stringify({ trajeto: 'texto livre' }))).toBeNull()
    expect(interpretarRota(JSON.stringify({ paradas: [ORIGEM] }))).toBeNull()
    expect(interpretarRota(JSON.stringify({ paradas: [ORIGEM, { ...DESTINO, latitude: 'x' }] }))).toBeNull()
    expect(interpretarRota(JSON.stringify({ paradas: [ORIGEM, { ...DESTINO, latitude: 120 }] }))).toBeNull()
  })

  it('coordenada_zero_e_valida', () => {
    expect(interpretarRota(JSON.stringify({ paradas: [{ ...ORIGEM, latitude: 0, longitude: 0 }, DESTINO] }))).not.toBeNull()
  })
})
