import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { EstatisticaDescritiva, IndicadorDeDemanda, IndicadorDeEstoque } from '@/lib/api/tipos'
import { formatarEstatistica, IndicadoresComplementares } from './indicadores-complementares'

function estatistica(parcial: Partial<EstatisticaDescritiva> = {}): EstatisticaDescritiva {
  return { quantidade: 4, soma: 20, media: 5, mediana: 4.5, minimo: 1, maximo: 10, desvioPadraoAmostral: 3.2, coeficienteDeVariacao: 0.64, ...parcial }
}

const ESTOQUE: IndicadorDeEstoque = {
  aviso: 'Indicadores didáticos.',
  totalDeBolsasDisponiveis: 12,
  porTipoSanguineo: [],
  porComponente: [
    { categoria: 'PLASMA', quantidade: 8 },
    { categoria: 'PLAQUETAS', quantidade: 4 },
  ],
  distribuicaoPorTipo: estatistica(),
}

const DEMANDA: IndicadorDeDemanda = {
  aviso: 'Indicadores didáticos.',
  totalDeRequisicoes: 1,
  porHospital: [{ categoria: 'Hospital da Restauração', quantidade: 1 }],
  porPrioridade: [],
  distribuicaoPorHospital: estatistica({ quantidade: 1 }),
}

describe('IndicadoresComplementares', () => {
  it('numeros_nao_finitos_viram_traco', () => {
    expect(formatarEstatistica(Number.NaN)).toBe('—')
    expect(formatarEstatistica(Number.POSITIVE_INFINITY)).toBe('—')
    expect(formatarEstatistica(4.5)).toBe('4,5')
  })

  it('mostra_componente_traduzido_e_hospital', () => {
    render(<IndicadoresComplementares estoque={ESTOQUE} demanda={DEMANDA} />)
    expect(screen.getByText('Plasma')).toBeInTheDocument()
    expect(screen.getByText('Hospital da Restauração')).toBeInTheDocument()
  })

  it('uma_amostra_nao_mostra_dispersao', () => {
    render(<IndicadoresComplementares estoque={ESTOQUE} demanda={DEMANDA} />)
    const bloco = screen.getByText('Distribuição entre hospitais').parentElement as HTMLElement
    expect(within(bloco).getByText('Uma amostra só: dispersão não se aplica.')).toBeInTheDocument()
    expect(within(bloco).queryByText('Desvio-padrão amostral')).not.toBeInTheDocument()
  })

  it('sem_dados_nao_renderiza', () => {
    const { container } = render(<IndicadoresComplementares estoque={null} demanda={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
