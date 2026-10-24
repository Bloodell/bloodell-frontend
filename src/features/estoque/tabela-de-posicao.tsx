'use client'

import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { EstadoVazio } from '@/components/feedback/estados'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { ItemDeEstoque } from '@/lib/api/tipos'
import { dataHora, numero, rotulo } from '@/lib/formatos'

const colunas: Coluna<ItemDeEstoque>[] = [
  { id: 'unidade', cabecalho: 'Unidade', celula: (item) => item.unidadeNome, esqueleto: 'w-40' },
  {
    id: 'tipo',
    cabecalho: 'Tipo',
    celula: (item) => <span className="font-mono text-[13px] font-semibold">{item.tipoSanguineo}</span>,
    esqueleto: 'w-8',
  },
  { id: 'componente', cabecalho: 'Componente', celula: (item) => rotulo(item.componente), esqueleto: 'w-36' },
  {
    id: 'atualizado',
    cabecalho: 'Atualizado',
    celula: (item) => <span className="text-muted-foreground">{dataHora(item.atualizadoEm)}</span>,
    className: 'hidden md:table-cell',
    esqueleto: 'w-28',
  },
  {
    id: 'quantidade',
    cabecalho: 'Bolsas',
    celula: (item) => <span className="font-medium">{numero(item.quantidade)}</span>,
    className: 'text-right',
    esqueleto: 'ml-auto w-8',
  },
]

/** Posicao de estoque: contagem por unidade, tipo sanguineo e componente. */
export function TabelaDePosicao({ recurso }: { recurso: EstadoDoRecurso<ItemDeEstoque[]> }) {
  const itens = recurso.dados ?? []
  const paginacao = usePaginacaoLocal(itens, 8)

  return (
    <TabelaDeDados
      colunas={colunas}
      linhas={paginacao.itensDaPagina}
      chave={(item) => item.id}
      carregando={recurso.carregando}
      erro={recurso.erro}
      aoTentarNovamente={recurso.recarregar}
      linhasDoEsqueleto={5}
      vazio={
        <EstadoVazio
          titulo="Nenhuma contagem de estoque"
          descricao="Não há bolsas para os filtros escolhidos. Registre uma doação para abastecer o estoque."
        />
      }
      rodape={
        paginacao.totalPaginas > 1 && (
          <Paginacao
            pagina={paginacao.pagina}
            totalPaginas={paginacao.totalPaginas}
            totalItens={paginacao.totalItens}
            tamanho={paginacao.tamanho}
            aoMudar={paginacao.setPagina}
          />
        )
      }
    />
  )
}
