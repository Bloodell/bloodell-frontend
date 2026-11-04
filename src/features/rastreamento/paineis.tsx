import { ArrowRight, Clock, Crosshair, FlaskConical, Gauge, Route, Satellite, Siren, Truck, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { rotulo, tomDaEntrega, tomDaPrioridade, numero } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { ehUrgente, type EntregaNoMapa, type EstadoDoVeiculo, type FonteDaPosicao } from './modelo'
import { distanciaRestanteKm, etaEmMin } from './posicao'

export const classePainel = 'rounded-xl border bg-card/92 shadow-lg backdrop-blur-md'

const TEXTO_DA_FONTE: Record<FonteDaPosicao, string> = {
  simulacao: 'SIMULAÇÃO: posição fictícia, não é rastreamento real',
  telemetria: 'Posição reportada pelo veículo (GPS)',
  estimada: 'Posição estimada pelo horário de início (sem GPS)',
}

export function minutos(valor: number | null): string {
  if (valor === null) return '—'
  if (valor < 60) return `${valor} min`
  return `${Math.floor(valor / 60)} h ${String(valor % 60).padStart(2, '0')} min`
}

export function MarcaDeSimulacao({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-atencao/40 bg-atencao-suave px-2 py-0.5 text-apoio font-semibold tracking-wide text-atencao',
        className,
      )}
    >
      <FlaskConical className="size-3" aria-hidden="true" />
      SIMULAÇÃO
    </span>
  )
}

// --- Indicadores -----------------------------------------------------------

function Indicador({ icone: Icone, nome, valor, destaque }: { icone: typeof Truck; nome: string; valor: ReactNode; destaque?: boolean }) {
  return (
    <div className={cn(classePainel, 'flex items-center gap-3 px-3.5 py-2.5', destaque && 'border-critico/40')}>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          destaque ? 'bg-critico-suave text-critico' : 'bg-secondary text-secondary-foreground',
        )}
      >
        <Icone className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-apoio text-muted-foreground">{nome}</p>
        <p className="text-subtitulo leading-tight font-semibold tabular-nums">{valor}</p>
      </div>
    </div>
  )
}

export function FaixaDeIndicadores({ entregas, estados }: { entregas: EntregaNoMapa[]; estados: Map<string, EstadoDoVeiculo> }) {
  const emTransito = entregas.filter((e) => e.status === 'EM_TRANSPORTE').length
  const urgentes = entregas.filter((e) => ehUrgente(e.prioridade)).length
  const previsoes = entregas
    .map((e) => (estados.get(e.id) ? etaEmMin(e, estados.get(e.id)!) : null))
    .filter((valor): valor is number => valor !== null)
  const etaMedio = previsoes.length ? Math.round(previsoes.reduce((soma, v) => soma + v, 0) / previsoes.length) : null

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Indicadores da operação">
      <Indicador icone={Route} nome="Entregas ativas" valor={numero(entregas.length)} />
      <Indicador icone={Siren} nome="Entregas urgentes" valor={numero(urgentes)} destaque={urgentes > 0} />
      <Indicador icone={Truck} nome="Veículos em trânsito" valor={numero(emTransito)} />
      <Indicador icone={Clock} nome="ETA médio" valor={minutos(etaMedio)} />
    </div>
  )
}

// --- Lista -----------------------------------------------------------------

export function ListaDeEntregas({
  entregas,
  estados,
  selecionadaId,
  aoSelecionar,
}: {
  entregas: EntregaNoMapa[]
  estados: Map<string, EstadoDoVeiculo>
  selecionadaId: string | null
  aoSelecionar: (id: string) => void
}) {
  // Emergencia primeiro, depois urgente e eletiva: a mesma regra da fila de atendimento.
  const ordem = { EMERGENCIA: 0, URGENTE: 1, ELETIVA: 2 } as const
  const ordenadas = [...entregas].sort((a, b) => ordem[a.prioridade ?? 'ELETIVA'] - ordem[b.prioridade ?? 'ELETIVA'])

  return (
    <ul className="max-h-[calc(100dvh-24rem)] min-h-0 space-y-1.5 overflow-y-auto p-2">
      {ordenadas.map((entrega) => {
        const estado = estados.get(entrega.id)
        const progresso = estado?.progresso ?? 0
        const ativa = entrega.id === selecionadaId
        return (
          <li key={entrega.id}>
            <button
              type="button"
              onClick={() => aoSelecionar(entrega.id)}
              aria-pressed={ativa}
              className={cn(
                'w-full rounded-lg border p-2.5 text-left transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                ativa ? 'border-primary bg-secondary/70' : 'bg-card',
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-rotulo font-semibold">{entrega.codigo}</span>
                {entrega.prioridade && <Badge tom={tomDaPrioridade(entrega.prioridade)}>{rotulo(entrega.prioridade)}</Badge>}
              </span>
              <span className="mt-1 flex items-center gap-1 text-apoio text-muted-foreground">
                <span className="truncate">{entrega.origem.nome}</span>
                <ArrowRight className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{entrega.destino.nome}</span>
              </span>
              <span className="mt-2 flex items-center gap-2">
                <span
                  role="progressbar"
                  aria-label={`Progresso da entrega ${entrega.codigo}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progresso * 100)}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                >
                  <span className="block h-full rounded-full bg-frio" style={{ width: `${progresso * 100}%` }} />
                </span>
                <span className="w-9 text-right text-apoio tabular-nums text-muted-foreground">{Math.round(progresso * 100)}%</span>
              </span>
              <span className="mt-1.5 flex items-center justify-between gap-2">
                <Badge tom={tomDaEntrega(entrega.status)}>{rotulo(entrega.status)}</Badge>
                <span className="text-apoio text-muted-foreground tabular-nums">
                  ETA {estado ? minutos(etaEmMin(entrega, estado)) : '—'}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// --- Detalhes da entrega selecionada ----------------------------------------

function Linha({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2 last:border-0">
      <dt className="shrink-0 text-apoio text-muted-foreground">{nome}</dt>
      <dd className="min-w-0 text-right text-rotulo font-medium tabular-nums">{children}</dd>
    </div>
  )
}

export function DetalhesDaEntrega({
  entrega,
  estado,
  seguindo,
  aoFechar,
  aoSeguir,
  aoEnquadrar,
}: {
  entrega: EntregaNoMapa
  estado: EstadoDoVeiculo | undefined
  seguindo: boolean
  aoFechar: () => void
  aoSeguir: () => void
  aoEnquadrar: () => void
}) {
  const progresso = estado?.progresso ?? 0
  const eta = estado ? etaEmMin(entrega, estado) : null
  const fonte = estado?.fonte ?? (entrega.simulada ? 'simulacao' : 'estimada')

  return (
    <section
      aria-label={`Detalhes da entrega ${entrega.codigo}`}
      className={cn(classePainel, 'w-80 animate-[painel-entra_220ms_cubic-bezier(0.23,1,0.32,1)] overflow-hidden')}
    >
      <header className="flex items-start justify-between gap-3 border-b p-3.5">
        <div className="min-w-0">
          <p className="truncate font-mono text-subtitulo font-semibold">{entrega.codigo}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-apoio text-muted-foreground">
            <Truck className="size-3.5" aria-hidden="true" />
            <span className="font-mono">{entrega.placa}</span>
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Fechar detalhes" onClick={aoFechar}>
          <X />
        </Button>
      </header>

      <div className="space-y-3 p-3.5">
        <div className="flex flex-wrap gap-1.5">
          {entrega.prioridade && <Badge tom={tomDaPrioridade(entrega.prioridade)}>{rotulo(entrega.prioridade)}</Badge>}
          <Badge tom={tomDaEntrega(entrega.status)}>{rotulo(entrega.status)}</Badge>
          {entrega.simulada && <MarcaDeSimulacao />}
        </div>

        <div className="rounded-lg border bg-muted/50 p-3">
          <ol className="space-y-2 text-rotulo">
            <li className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              <span className="min-w-0 truncate">
                <span className="text-apoio text-muted-foreground">Origem · </span>
                {entrega.origem.nome}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-sm bg-foreground" aria-hidden="true" />
              <span className="min-w-0 truncate">
                <span className="text-apoio text-muted-foreground">Destino · </span>
                {entrega.destino.nome}
              </span>
            </li>
          </ol>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-apoio text-muted-foreground">Progresso da entrega</span>
            <span className="text-rotulo font-semibold tabular-nums">{Math.round(progresso * 100)}%</span>
          </div>
          <div
            role="progressbar"
            aria-label="Progresso da entrega"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progresso * 100)}
            className="h-2 overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-frio" style={{ width: `${progresso * 100}%` }} />
          </div>
        </div>

        <dl>
          <Linha nome="ETA">{minutos(eta)}</Linha>
          <Linha nome="Distância restante">
            {estado ? `${distanciaRestanteKm(entrega, estado).toFixed(1).replace('.', ',')} km` : '—'}
          </Linha>
          <Linha nome="Distância da rota">{`${entrega.trajeto.comprimentoKm.toFixed(1).replace('.', ',')} km`}</Linha>
          <Linha nome="Velocidade">
            {estado?.emMovimento ? (entrega.simulada ? 'simulada' : 'em deslocamento') : 'parado'}
          </Linha>
        </dl>

        <p className="flex items-start gap-2 rounded-lg border bg-muted/40 p-2.5 text-apoio text-muted-foreground">
          {fonte === 'simulacao' ? (
            <FlaskConical className="mt-px size-3.5 shrink-0 text-atencao" aria-hidden="true" />
          ) : (
            <Satellite className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>
            {TEXTO_DA_FONTE[fonte]}.{' '}
            {entrega.fonteDaRota === 'estradas'
              ? 'Rota por ruas calculada por serviço de roteamento.'
              : 'Trajeto aproximado: o serviço de rotas não respondeu.'}
          </span>
        </p>

        <div className="flex gap-2">
          <Button size="sm" variant={seguindo ? 'default' : 'outline'} className="flex-1" aria-pressed={seguindo} onClick={aoSeguir}>
            <Crosshair />
            {seguindo ? 'Seguindo' : 'Seguir veículo'}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={aoEnquadrar}>
            <Gauge />
            Ver rota
          </Button>
        </div>
      </div>
    </section>
  )
}
