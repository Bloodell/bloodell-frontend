'use client'

import { ChevronDown, Gauge } from 'lucide-react'
import { EstadoDeErro } from '@/components/feedback/estados'
import { Skeleton } from '@/components/ui/skeleton'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { MetricasDeTelemetria } from '@/lib/api/tipos'
import { numero } from '@/lib/formatos'

function Linha({ rotulo, valor, explicacao }: { rotulo: string; valor: string; explicacao: string }) {
  return (
    <div className="grid gap-0.5 border-b py-3 last:border-b-0 sm:grid-cols-[220px_120px_minmax(0,1fr)] sm:items-baseline sm:gap-4">
      <dt className="text-rotulo font-medium">{rotulo}</dt>
      <dd className="font-mono text-sm tabular-nums">{valor}</dd>
      <dd className="text-apoio text-muted-foreground">{explicacao}</dd>
    </div>
  )
}

/**
 * Contadores tecnicos da ingestao de telemetria (fila + workers em lote).
 * Material didatico de concorrencia, nao indicador operacional: fica
 * recolhido e so aparece para quem o backend autoriza (ADMIN).
 */
export function PainelDeDiagnostico({ metricas }: { metricas: EstadoDoRecurso<MetricasDeTelemetria> }) {
  const dados = metricas.dados
  const ocupacao = dados && dados.capacidadeDaFila > 0 ? Math.round((dados.tamanhoAtualDaFila / dados.capacidadeDaFila) * 100) : null

  return (
    <details className="group rounded-xl border bg-card shadow-xs">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Gauge className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-subtitulo font-semibold tracking-tight">Diagnóstico da ingestão</span>
          <span className="block text-apoio text-muted-foreground">
            Fila e workers que gravam a telemetria em lote. Contadores desde que o backend iniciou.
          </span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="border-t px-6 pb-2">
        {metricas.erro ? (
          <EstadoDeErro mensagem={metricas.erro} aoTentarNovamente={metricas.recarregar} className="py-8" />
        ) : !dados ? (
          <div className="space-y-3 py-4">
            {[0, 1, 2, 3].map((indice) => (
              <Skeleton key={indice} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <dl>
            <Linha rotulo="Leituras recebidas" valor={numero(dados.leiturasRecebidas)} explicacao="Aceitas pela API (resposta 202). Aceitar não é gravar." />
            <Linha rotulo="Leituras persistidas" valor={numero(dados.leiturasPersistidas)} explicacao="Já gravadas no banco pelos workers." />
            <Linha
              rotulo="Recusadas por fila cheia"
              valor={numero(dados.leiturasRecusadas)}
              explicacao="A fila estava na capacidade máxima e a API respondeu para tentar de novo."
            />
            <Linha
              rotulo="Fila agora"
              valor={`${numero(dados.tamanhoAtualDaFila)} / ${numero(dados.capacidadeDaFila)}`}
              explicacao={ocupacao === null ? 'Capacidade não informada.' : `${ocupacao}% ocupada, aguardando gravação.`}
            />
            <Linha rotulo="Workers" valor={numero(dados.quantidadeDeWorkers)} explicacao="Threads que consomem a fila em paralelo." />
            <Linha rotulo="Lotes gravados" valor={numero(dados.lotesGravados)} explicacao={`Tamanho médio de ${numero(dados.tamanhoMedioDoLote)} leituras por lote.`} />
            <Linha
              rotulo="Tempo total de gravação"
              valor={`${numero(dados.tempoTotalDeGravacaoMs)} ms`}
              explicacao="Soma do tempo gasto gravando lotes."
            />
          </dl>
        )}
      </div>
    </details>
  )
}
