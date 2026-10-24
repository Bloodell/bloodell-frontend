'use client'

import { ChevronRight } from 'lucide-react'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { EstadoVazio } from '@/components/feedback/estados'
import { Badge } from '@/components/ui/badge'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { Bolsa, Pagina } from '@/lib/api/tipos'
import { rotulo, tomDoEstadoDaBolsa } from '@/lib/formatos'
import { Validade } from './validade'

const colunas: Coluna<Bolsa>[] = [
  {
    id: 'chegada',
    cabecalho: 'Chegada',
    celula: (bolsa) => <span className="text-muted-foreground tabular-nums">#{bolsa.sequenciaEntrada}</span>,
    esqueleto: 'w-8',
  },
  {
    id: 'codigo',
    cabecalho: 'Código',
    celula: (bolsa) => <span className="font-mono text-[13px]">{bolsa.codigo}</span>,
    esqueleto: 'w-32',
  },
  {
    id: 'tipo',
    cabecalho: 'Tipo',
    celula: (bolsa) => <span className="font-mono text-[13px] font-semibold">{bolsa.tipoSanguineo}</span>,
    esqueleto: 'w-8',
  },
  {
    id: 'componente',
    cabecalho: 'Componente',
    celula: (bolsa) => rotulo(bolsa.componente),
    className: 'hidden md:table-cell',
    esqueleto: 'w-36',
  },
  {
    id: 'validade',
    cabecalho: 'Validade',
    celula: (bolsa) => <Validade dataValidade={bolsa.dataValidade} diasParaVencer={bolsa.diasParaVencer} />,
    esqueleto: 'w-24',
  },
  {
    id: 'status',
    cabecalho: 'Situação',
    celula: (bolsa) => <Badge tom={tomDoEstadoDaBolsa(bolsa.status)}>{rotulo(bolsa.status)}</Badge>,
    esqueleto: 'w-20',
  },
  {
    id: 'unidade',
    cabecalho: 'Unidade',
    celula: (bolsa) => <span className="text-muted-foreground">{bolsa.unidadeAtualNome}</span>,
    className: 'hidden lg:table-cell',
    esqueleto: 'w-32',
  },
  {
    id: 'abrir',
    cabecalho: <span className="sr-only">Histórico</span>,
    celula: () => <ChevronRight className="ml-auto size-4 text-muted-foreground/60" aria-hidden="true" />,
    className: 'w-8',
    esqueleto: 'hidden',
  },
]

/**
 * Bolsas na ordem de chegada (a mesma da lista encadeada da AED), paginadas
 * pela API. Clicar numa linha abre o historico da bolsa.
 */
export function TabelaDeBolsas({
  recurso,
  linhas,
  pagina,
  aoMudarPagina,
  aoAbrir,
  temBusca,
}: {
  recurso: EstadoDoRecurso<Pagina<Bolsa>>
  linhas: Bolsa[]
  pagina: number
  aoMudarPagina: (pagina: number) => void
  aoAbrir: (bolsa: Bolsa) => void
  temBusca: boolean
}) {
  const resposta = recurso.dados

  return (
    <TabelaDeDados
      colunas={colunas}
      linhas={linhas}
      chave={(bolsa) => bolsa.id}
      carregando={recurso.carregando}
      erro={recurso.erro}
      aoTentarNovamente={recurso.recarregar}
      aoClicarLinha={aoAbrir}
      vazio={
        temBusca ? (
          <EstadoVazio
            titulo="Nenhuma bolsa corresponde à busca"
            descricao="A busca procura só nas bolsas desta página. Tente outra página ou ajuste os filtros."
          />
        ) : (
          <EstadoVazio titulo="Nenhuma bolsa encontrada" descricao="Ajuste os filtros ou registre uma nova doação." />
        )
      }
      rodape={
        resposta && (
          <Paginacao
            pagina={pagina}
            totalPaginas={resposta.totalPages}
            totalItens={resposta.totalElements}
            tamanho={resposta.size}
            aoMudar={aoMudarPagina}
          />
        )
      }
    />
  )
}
