'use client'

import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Pagina, Requisicao } from '@/lib/api/tipos'
import { numero, rotulo, tomDaPrioridade } from '@/lib/formatos'
import { cn } from '@/lib/utils'

export const TAMANHO_DA_PAGINA_DE_APTAS = 20

/**
 * Requisicoes ALOCADAS, paginadas pelo servidor: da para chegar a qualquer
 * uma, nao so as 100 primeiras. As que ja tem entrega ativa aparecem
 * desabilitadas (com o motivo), para a paginacao nao mudar de tamanho.
 */
export function SeletorDeRequisicao({
  valor,
  aoMudar,
  comEntregaAtiva,
  idDaMensagem,
  invalido,
}: {
  valor: number | null
  aoMudar: (requisicao: Requisicao) => void
  comEntregaAtiva: Set<number>
  idDaMensagem?: string
  invalido?: boolean
}) {
  const [pagina, setPagina] = useState(0)
  const aptas = useRecurso<Pagina<Requisicao>>(`/requisicoes?status=ALOCADA&page=${pagina}&size=${TAMANHO_DA_PAGINA_DE_APTAS}`)
  const dados = aptas.dados

  if (aptas.erro) return <EstadoDeErro mensagem={aptas.erro} aoTentarNovamente={aptas.recarregar} className="py-6" />

  if (!dados) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((indice) => (
          <Skeleton key={indice} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (dados.totalElements === 0) {
    return (
      <EstadoVazio
        icone={ClipboardList}
        titulo="Nenhuma requisição pronta para entrega"
        descricao="Processe uma requisição da fila em Requisições. Quando ela ficar alocada, aparece aqui."
        className="py-8"
      />
    )
  }

  return (
    <div className="space-y-2">
      <div
        role="radiogroup"
        aria-label="Requisição alocada"
        aria-describedby={idDaMensagem}
        className={cn('max-h-72 space-y-1.5 overflow-y-auto rounded-lg p-0.5', invalido && 'ring-1 ring-critico/50', aptas.carregando && 'opacity-60')}
      >
        {dados.content.map((requisicao) => {
          const bloqueada = comEntregaAtiva.has(requisicao.id)
          const marcada = valor === requisicao.id
          const bolsas = requisicao.itens.reduce((soma, item) => soma + item.quantidadeAlocada, 0)
          return (
            <label
              key={requisicao.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                marcada ? 'border-primary/50 bg-secondary/60' : 'hover:bg-muted/40',
                bloqueada && 'cursor-not-allowed opacity-60 hover:bg-transparent',
              )}
            >
              <input
                type="radio"
                name="requisicao-da-entrega"
                className="sr-only"
                value={requisicao.id}
                checked={marcada}
                disabled={bloqueada}
                onChange={() => aoMudar(requisicao)}
              />
              <span
                className={cn('flex size-4 shrink-0 items-center justify-center rounded-full border border-input', marcada && 'border-primary')}
                aria-hidden="true"
              >
                <span className={cn('size-2 rounded-full bg-primary transition-transform', marcada ? 'scale-100' : 'scale-0')} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-rotulo font-medium">{requisicao.codigo}</span>
                  <Badge tom={tomDaPrioridade(requisicao.prioridade)} className="py-0">
                    {rotulo(requisicao.prioridade)}
                  </Badge>
                </span>
                <span className="block truncate text-apoio text-muted-foreground">
                  {requisicao.hospitalNome} · {bolsas} bolsa(s) alocada(s)
                  {bloqueada && ' · já tem entrega ativa'}
                </span>
              </span>
            </label>
          )
        })}
      </div>

      {dados.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-apoio text-muted-foreground tabular-nums">
            Página {pagina + 1} de {numero(dados.totalPages)} · {numero(dados.totalElements)} alocadas
          </p>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon-sm" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)} aria-label="Requisições anteriores">
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={pagina + 1 >= dados.totalPages}
              onClick={() => setPagina((p) => p + 1)}
              aria-label="Próximas requisições"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
