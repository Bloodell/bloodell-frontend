'use client'

import { History } from 'lucide-react'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Badge } from '@/components/ui/badge'
import { Separator, Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Bolsa, EventoDeRastreabilidade } from '@/lib/api/tipos'
import { data, dataHora, rotulo, tomDoEstadoDaBolsa } from '@/lib/formatos'
import { Validade } from './validade'

function Detalhe({ rotulo: nome, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{nome}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

/** Gaveta com os dados da bolsa e a linha do tempo dos eventos. */
export function PainelDeRastreabilidade({ bolsa, aoFechar }: { bolsa: Bolsa | null; aoFechar: () => void }) {
  const eventos = useRecurso<EventoDeRastreabilidade[]>(bolsa ? `/bolsas/${bolsa.id}/rastreabilidade` : null)

  return (
    <Sheet
      aberto={bolsa !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={<span className="font-mono">{bolsa?.codigo}</span>}
      descricao="Dados da bolsa e histórico de rastreabilidade"
    >
      {bolsa && (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Detalhe rotulo="Tipo sanguíneo">
              <span className="font-mono font-semibold">{bolsa.tipoSanguineo}</span>
            </Detalhe>
            <Detalhe rotulo="Situação">
              <Badge tom={tomDoEstadoDaBolsa(bolsa.status)}>{rotulo(bolsa.status)}</Badge>
            </Detalhe>
            <Detalhe rotulo="Componente">{rotulo(bolsa.componente)}</Detalhe>
            <Detalhe rotulo="Unidade atual">{bolsa.unidadeAtualNome}</Detalhe>
            <Detalhe rotulo="Coleta">{data(bolsa.dataColeta)}</Detalhe>
            <Detalhe rotulo="Validade">
              <Validade dataValidade={bolsa.dataValidade} diasParaVencer={bolsa.diasParaVencer} />
            </Detalhe>
          </dl>

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-medium">Linha do tempo</h3>
            {eventos.erro ? (
              <EstadoDeErro mensagem={eventos.erro} aoTentarNovamente={eventos.recarregar} className="py-8" />
            ) : eventos.carregando ? (
              <div className="space-y-5">
                {[0, 1, 2].map((indice) => (
                  <div key={indice} className="flex gap-3">
                    <Skeleton className="size-2.5 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (eventos.dados ?? []).length === 0 ? (
              <EstadoVazio icone={History} titulo="Nenhum evento registrado" className="py-8" />
            ) : (
              <ol className="relative space-y-5 border-l pl-5">
                {(eventos.dados ?? []).map((evento) => (
                  <li key={evento.id} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-background bg-primary" />
                    <p className="text-sm">
                      {evento.statusAnterior ? (
                        <>
                          {rotulo(evento.statusAnterior)} <span className="text-muted-foreground">→</span>{' '}
                        </>
                      ) : null}
                      <span className="font-medium">{rotulo(evento.statusNovo)}</span>
                    </p>
                    {evento.descricao && <p className="mt-0.5 text-[13px] text-muted-foreground">{evento.descricao}</p>}
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">{dataHora(evento.ocorridoEm)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}
