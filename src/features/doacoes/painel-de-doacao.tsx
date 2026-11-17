'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { EstadoDeErro } from '@/components/feedback/estados'
import { Badge } from '@/components/ui/badge'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Doacao } from '@/lib/api/tipos'
import { data, dataHora, rotulo, tomDoEstadoDaBolsa } from '@/lib/formatos'

/**
 * Doacao historica pelo GET /doacoes/{id}: o que foi coletado e as bolsas
 * geradas, com atalho para a rastreabilidade de cada uma. A API nao permite
 * editar nem apagar doacao, entao nao ha esses botoes.
 */
export function PainelDeDoacao({
  doacaoId,
  nomeDoHemocentro,
  aoFechar,
}: {
  doacaoId: number | null
  nomeDoHemocentro: (id: number) => string
  aoFechar: () => void
}) {
  const detalhe = useRecurso<Doacao>(doacaoId === null ? null : `/doacoes/${doacaoId}`)
  const doacao = detalhe.dados

  return (
    <Sheet
      aberto={doacaoId !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={doacao ? <span className="font-mono">{doacao.codigo}</span> : 'Doação'}
      descricao={doacao ? `${nomeDoHemocentro(doacao.hemocentroId)} · coleta em ${dataHora(doacao.dataHora)}` : undefined}
    >
      {detalhe.erro ? (
        <EstadoDeErro
          mensagem={detalhe.statusHttp === 404 ? 'Esta doação não existe ou está fora do alcance da sua conta.' : detalhe.erro}
          aoTentarNovamente={detalhe.recarregar}
        />
      ) : !doacao ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <dt className="text-apoio text-muted-foreground">Tipo sanguíneo</dt>
              <dd className="mt-0.5 font-mono text-base font-semibold">{doacao.tipoSanguineo}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-apoio text-muted-foreground">Volume coletado</dt>
              <dd className="mt-0.5 text-base font-semibold tabular-nums">{doacao.volumeMl} ml</dd>
            </div>
          </dl>

          <section aria-labelledby="titulo-bolsas-geradas" className="space-y-2">
            <h3 id="titulo-bolsas-geradas" className="text-subtitulo font-semibold">
              Bolsas geradas
            </h3>
            <p className="text-apoio text-muted-foreground">Situação no momento do registro. Abra a bolsa para ver onde ela está agora.</p>
            <ul className="divide-y rounded-lg border">
              {doacao.bolsasGeradas.map((bolsa) => (
                <li key={bolsa.id}>
                  <Link
                    href={`/estoque?bolsa=${bolsa.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-mono text-rotulo">
                        {bolsa.codigo}
                        <ArrowUpRight className="size-3 text-muted-foreground" aria-hidden="true" />
                      </span>
                      <span className="block text-apoio text-muted-foreground">
                        {rotulo(bolsa.componente)} · vence {data(bolsa.dataValidade)}
                      </span>
                    </span>
                    <Badge tom={tomDoEstadoDaBolsa(bolsa.status)}>{rotulo(bolsa.status)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Sheet>
  )
}
