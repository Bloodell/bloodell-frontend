'use client'

import { ChevronRight, ClipboardPlus, Play } from 'lucide-react'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { EstadoVazio } from '@/components/feedback/estados'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { Pagina, Requisicao } from '@/lib/api/tipos'
import { dataHora, rotulo, tomDaPrioridade, tomDoStatusDaRequisicao } from '@/lib/formatos'

export function TabelaDeRequisicoes({
  recurso,
  pagina,
  aoMudarPagina,
  processando,
  aoProcessar,
  aoAbrir,
  filtrada,
  aoCriar,
}: {
  recurso: EstadoDoRecurso<Pagina<Requisicao>>
  pagina: number
  aoMudarPagina: (pagina: number) => void
  processando: number | null
  aoProcessar: (requisicao: Requisicao) => void
  aoAbrir: (requisicao: Requisicao) => void
  filtrada: boolean
  aoCriar: () => void
}) {
  const colunas: Coluna<Requisicao>[] = [
    {
      id: 'codigo',
      cabecalho: 'Código',
      celula: (requisicao) => (
        <div className="min-w-0">
          <span className="font-mono text-rotulo whitespace-nowrap">{requisicao.codigo}</span>
          <p className="truncate text-apoio text-muted-foreground sm:hidden">{requisicao.hospitalNome}</p>
        </div>
      ),
      esqueleto: 'w-28',
    },
    {
      id: 'hospital',
      cabecalho: 'Hospital',
      celula: (requisicao) => (
        <div className="min-w-0">
          <p className="truncate">{requisicao.hospitalNome}</p>
          <p className="text-apoio text-muted-foreground 2xl:hidden">{dataHora(requisicao.criadaEm)}</p>
        </div>
      ),
      className: 'hidden sm:table-cell',
      esqueleto: 'w-36',
    },
    {
      id: 'itens',
      cabecalho: 'Pedido',
      celula: (requisicao) => (
        <div className="grid gap-0.5">
          {requisicao.itens.map((item) => (
            <span key={item.id} className="text-rotulo whitespace-nowrap">
              <span className="tabular-nums">{item.quantidade}×</span>{' '}
              <span className="font-mono font-semibold">{item.tipoSanguineo}</span>{' '}
              <span className="text-muted-foreground">{rotulo(item.componente)}</span>
              {item.quantidadeAlocada > 0 && (
                <span className={item.quantidadeAlocada < item.quantidade ? 'text-atencao' : 'text-muted-foreground'}>
                  {' '}
                  · {item.quantidadeAlocada}/{item.quantidade} alocada(s)
                </span>
              )}
            </span>
          ))}
        </div>
      ),
      className: 'hidden lg:table-cell',
      esqueleto: 'w-44',
    },
    {
      id: 'prioridade',
      cabecalho: 'Prioridade',
      celula: (requisicao) => <Badge tom={tomDaPrioridade(requisicao.prioridade)}>{rotulo(requisicao.prioridade)}</Badge>,
      className: 'hidden md:table-cell',
      esqueleto: 'w-20',
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (requisicao) => (
        <Badge tom={tomDoStatusDaRequisicao(requisicao.status)}>{rotulo(requisicao.status)}</Badge>
      ),
      esqueleto: 'w-20',
    },
    {
      id: 'criada',
      cabecalho: 'Criada',
      celula: (requisicao) => (
        <span className="whitespace-nowrap text-muted-foreground">{dataHora(requisicao.criadaEm)}</span>
      ),
      className: 'hidden 2xl:table-cell',
      esqueleto: 'w-24',
    },
    {
      id: 'acao',
      cabecalho: <span className="sr-only">Ações</span>,
      celula: (requisicao) => (
        <div className="flex items-center justify-end gap-1">
          {requisicao.status === 'NA_FILA' && (
            <Button
              variant="outline"
              size="sm"
              carregando={processando === requisicao.id}
              disabled={processando !== null && processando !== requisicao.id}
              onClick={() => aoProcessar(requisicao)}
            >
              {processando !== requisicao.id && <Play />}
              <span className="sr-only sm:not-sr-only">Processar</span>
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => aoAbrir(requisicao)} aria-label={`Abrir ${requisicao.codigo}`}>
            <ChevronRight />
          </Button>
        </div>
      ),
      className: 'w-24 text-right sm:w-40',
      esqueleto: 'ml-auto w-24',
    },
  ]

  const resposta = recurso.dados

  return (
    <TabelaDeDados
      colunas={colunas}
      linhas={resposta?.content ?? []}
      chave={(requisicao) => requisicao.id}
      carregando={recurso.carregando}
      erro={recurso.erro}
      aoTentarNovamente={recurso.recarregar}
      vazio={
        <EstadoVazio
          titulo={filtrada ? 'Nenhuma requisição com esses filtros' : 'Nenhuma requisição registrada'}
          descricao={filtrada ? 'Ajuste ou limpe os filtros.' : 'Quando um hospital pedir hemocomponentes, o pedido aparece aqui.'}
          acao={
            filtrada ? undefined : (
              <Button size="sm" onClick={aoCriar}>
                <ClipboardPlus />
                Nova requisição
              </Button>
            )
          }
        />
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
