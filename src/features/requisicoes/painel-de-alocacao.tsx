'use client'

import { AlertTriangle, Check, FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator, Sheet } from '@/components/ui/sheet'
import type { ResultadoDaAlocacao } from '@/lib/api/tipos'
import { data, rotulo, tomDoStatusDaRequisicao } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/**
 * Resultado de processar uma requisicao: o que foi alocado e cada passo que
 * o algoritmo realmente executou (vem da API, nao e texto da tela).
 */
export function PainelDeAlocacao({
  resultado,
  aoFechar,
}: {
  resultado: ResultadoDaAlocacao | null
  aoFechar: () => void
}) {
  const completa = resultado ? resultado.quantidadeAlocada >= resultado.quantidadeSolicitada : false

  return (
    <Sheet
      aberto={resultado !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={
        <>
          Alocação · <span className="font-mono">{resultado?.requisicaoCodigo}</span>
        </>
      }
      descricao={resultado ? `Política aplicada: ${resultado.politicaAplicada}` : undefined}
      className="max-w-lg"
    >
      {resultado && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Bolsas alocadas</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {resultado.quantidadeAlocada}
                <span className="text-base font-normal text-muted-foreground"> / {resultado.quantidadeSolicitada}</span>
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Status da requisição</p>
              <Badge className="mt-2" tom={tomDoStatusDaRequisicao(resultado.statusRequisicao)}>
                {rotulo(resultado.statusRequisicao)}
              </Badge>
            </div>
          </div>

          {!completa && (
            <div className="flex gap-2.5 rounded-lg border border-amber-600/20 bg-amber-500/8 px-3.5 py-3 text-[13px]">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
              <p>Estoque insuficiente para atender toda a quantidade solicitada.</p>
            </div>
          )}

          {resultado.bolsas.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">Bolsas reservadas</h3>
              <ul className="divide-y rounded-lg border">
                {resultado.bolsas.map((bolsa) => (
                  <li key={bolsa.bolsaId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="shrink-0 font-mono text-[13px] whitespace-nowrap">{bolsa.codigo}</span>
                    <span className="text-right text-xs text-muted-foreground">
                      {bolsa.tipoSanguineo} · {rotulo(bolsa.componente)} · vence {data(bolsa.dataValidade)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-medium">Passos da decisão</h3>
            <ol className="space-y-0">
              {resultado.passos.map((passo, indice) => (
                <li key={passo.ordem} className="relative flex gap-3 pb-5 last:pb-0">
                  {indice < resultado.passos.length - 1 && (
                    <span className="absolute top-7 bottom-0 left-[13px] w-px bg-border" aria-hidden="true" />
                  )}
                  <span
                    className={cn(
                      'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium tabular-nums',
                    )}
                  >
                    {indice === resultado.passos.length - 1 ? <Check className="size-3.5" /> : passo.ordem}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-sm font-medium">{passo.etapa}</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{passo.detalhe}</p>
                    <p className="mt-1.5 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs">{passo.resultado}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <p className="flex gap-2.5 rounded-lg border border-dashed px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
            <FlaskConical className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">Unidade 1, regra provisória.</span> {resultado.avisoAcademico}
            </span>
          </p>
        </div>
      )}
    </Sheet>
  )
}
