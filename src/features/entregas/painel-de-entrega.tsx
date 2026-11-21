'use client'

import { Building2, Check, Hospital, Info, MapPinned, Route, Save } from 'lucide-react'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { EstadoDeErro } from '@/components/feedback/estados'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { useEnvio } from '@/components/form/use-envio'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator, Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Entrega } from '@/lib/api/tipos'
import { dataHora, rotulo, tomDaEntrega } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import {
  atualizarPlanejamento,
  avancarEntrega,
  ETAPAS,
  numeroOuNulo,
  PROXIMA_ETAPA,
  roteirizarEntrega,
  validarPlanejamento,
  type ValoresDePlanejamento,
} from './entregas-api'
import { interpretarRota } from './rota-planejada'

const formatoKm = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

/** As quatro etapas, com a atual marcada. Cancelada aparece a parte. */
function LinhaDoTempo({ entrega }: { entrega: Entrega }) {
  const atual = ETAPAS.indexOf(entrega.status)
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Etapas da entrega">
      {ETAPAS.map((etapa, indice) => {
        const feita = atual >= 0 && indice < atual
        const agora = indice === atual
        return (
          <li key={etapa} className="grid gap-1.5" aria-current={agora ? 'step' : undefined}>
            <span
              className={cn(
                'h-1 rounded-full',
                feita || agora ? (entrega.status === 'ENTREGUE' ? 'bg-estavel' : 'bg-frio') : 'bg-muted',
              )}
              aria-hidden="true"
            />
            <span className={cn('flex items-center gap-1 text-apoio', agora ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {feita && <Check className="size-3" aria-hidden="true" />}
              {rotulo(etapa)}
              {feita && <span className="sr-only">(concluída)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function PainelDeEntrega({
  entregaId,
  aoFechar,
  aoMudar,
}: {
  entregaId: number | null
  aoFechar: () => void
  aoMudar: () => void
}) {
  const detalhe = useRecurso<Entrega>(entregaId === null ? null : `/entregas/${entregaId}`)
  const entrega = detalhe.dados

  return (
    <Sheet
      aberto={entregaId !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={entrega ? <>Entrega da <span className="font-mono">{entrega.requisicaoCodigo}</span></> : 'Entrega'}
      descricao={entrega ? `Veículo ${entrega.veiculoPlaca} · saída de ${entrega.origemNome}` : undefined}
      className="max-w-lg"
    >
      {detalhe.erro ? (
        <EstadoDeErro
          mensagem={detalhe.statusHttp === 404 ? 'Esta entrega não existe ou está fora do alcance da sua conta.' : detalhe.erro}
          aoTentarNovamente={detalhe.recarregar}
        />
      ) : !entrega ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <ConteudoDaEntrega
          key={`${entrega.id}-${entrega.status}-${entrega.rota ?? ''}-${entrega.distanciaKm ?? ''}-${entrega.tempoEstimadoMin ?? ''}`}
          entrega={entrega}
          aoMudar={() => {
            detalhe.recarregar()
            aoMudar()
          }}
        />
      )}
    </Sheet>
  )
}

function ConteudoDaEntrega({ entrega, aoMudar }: { entrega: Entrega; aoMudar: () => void }) {
  const [roteirizando, setRoteirizando] = useState(false)
  const [avancando, setAvancando] = useState(false)
  const rota = interpretarRota(entrega.rota)
  const planejada = entrega.status === 'PLANEJADA'
  const etapa = PROXIMA_ETAPA[entrega.status]

  async function calcularRota() {
    setRoteirizando(true)
    try {
      const atualizada = await roteirizarEntrega(entrega.id)
      toast.success('Rota calculada', {
        description:
          atualizada.distanciaKm !== null ? `${formatoKm.format(atualizada.distanciaKm)} km em linha reta.` : undefined,
      })
    } catch (falha) {
      toast.error('Não foi possível calcular a rota', { description: mensagemDeErro(falha, 'Erro inesperado.') })
    } finally {
      setRoteirizando(false)
      aoMudar()
    }
  }

  async function avancar() {
    if (!etapa) return
    setAvancando(true)
    try {
      await avancarEntrega(entrega)
      toast.success(`${etapa.rotulo}: feito`, { description: etapa.efeito })
    } catch (falha) {
      // Nao repete a mutacao: mostra o motivo e reconcilia com o servidor.
      toast.error(`Não foi possível ${etapa.rotulo.toLowerCase()}`, { description: mensagemDeErro(falha, 'Erro inesperado.') })
    } finally {
      setAvancando(false)
      aoMudar()
    }
  }

  return (
    <div className="space-y-7">
      <div className="space-y-3">
        <Badge tom={tomDaEntrega(entrega.status)}>{rotulo(entrega.status)}</Badge>
        {entrega.status !== 'CANCELADA' && <LinhaDoTempo entrega={entrega} />}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-apoio">
          <dt className="text-muted-foreground">Saída</dt>
          <dd className="tabular-nums">{entrega.iniciadaEm ? dataHora(entrega.iniciadaEm) : '—'}</dd>
          <dt className="text-muted-foreground">Chegada</dt>
          <dd className="tabular-nums">{entrega.concluidaEm ? dataHora(entrega.concluidaEm) : '—'}</dd>
        </dl>
      </div>

      <section aria-labelledby="titulo-rota" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 id="titulo-rota" className="text-subtitulo font-semibold">
            Rota planejada
          </h3>
          {planejada && (
            <Button size="sm" variant={rota ? 'ghost' : 'default'} onClick={calcularRota} carregando={roteirizando}>
              {!roteirizando && <Route />}
              {rota ? 'Recalcular' : 'Calcular rota'}
            </Button>
          )}
        </div>

        {rota ? (
          <ol className="relative space-y-3 rounded-lg border p-4">
            {rota.paradas.map((parada, indice) => {
              const Icone = parada.tipo === 'HOSPITAL' ? Hospital : Building2
              return (
                <li key={`${parada.ordem}-${parada.unidadeId}`} className="relative flex gap-3">
                  {indice < rota.paradas.length - 1 && (
                    <span className="absolute top-7 -bottom-3 left-[13px] w-px border-l border-dashed border-input" aria-hidden="true" />
                  )}
                  <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
                    <Icone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-rotulo font-medium">{parada.nome}</span>
                    <span className="block text-apoio text-muted-foreground">
                      {indice === 0 ? 'Origem' : indice === rota.paradas.length - 1 ? 'Destino' : `Parada ${indice}`} ·{' '}
                      <span className="font-mono">
                        {parada.latitude.toFixed(4)}, {parada.longitude.toFixed(4)}
                      </span>
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
        ) : entrega.rota ? (
          <Alerta tipo="info" titulo="Rota indisponível">
            A entrega tem uma rota gravada em formato que a interface não reconhece.{' '}
            {planejada ? 'Recalcule para substituí-la.' : ''}
          </Alerta>
        ) : (
          <p className="text-rotulo text-muted-foreground">
            {planejada ? 'Ainda sem rota. Calcule para ver as paradas e a distância.' : 'Esta entrega saiu sem rota calculada.'}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <dt className="text-apoio text-muted-foreground">Distância</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">
              {entrega.distanciaKm !== null ? `${formatoKm.format(entrega.distanciaKm)} km` : '—'}
            </dd>
            {entrega.distanciaKm !== null && <dd className="text-apoio text-muted-foreground">em linha reta</dd>}
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-apoio text-muted-foreground">Tempo estimado</dt>
            <dd className="mt-0.5 text-sm font-medium tabular-nums">
              {entrega.tempoEstimadoMin !== null ? `${entrega.tempoEstimadoMin} min` : '—'}
            </dd>
          </div>
        </dl>
        <p className="flex gap-2 text-apoio text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          O backend calcula a distância em linha reta (Haversine), não o caminho pelas ruas. O trajeto viário aparece só na
          Central logística, estimado por um serviço externo.
        </p>
        {entrega.status !== 'ENTREGUE' && entrega.status !== 'CANCELADA' && (
          <Link href="/rastreamento" className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto px-0')}>
            <MapPinned />
            Ver na Central logística
          </Link>
        )}
      </section>

      {planejada && (
        <>
          <Separator />
          <FormularioDePlanejamento entrega={entrega} aoSalvar={aoMudar} />
        </>
      )}

      <Separator />

      <section aria-label="Próxima etapa" className="space-y-3">
        {etapa ? (
          <>
            <Button className="w-full" onClick={avancar} carregando={avancando}>
              {etapa.rotulo}
            </Button>
            <p className="text-apoio text-muted-foreground">{etapa.efeito}</p>
          </>
        ) : (
          <p className="text-rotulo text-muted-foreground">
            {entrega.status === 'ENTREGUE' ? 'Entrega concluída. Nada mais a fazer.' : 'Entrega cancelada.'}
          </p>
        )}
        {entrega.status !== 'ENTREGUE' && entrega.status !== 'CANCELADA' && (
          <p className="flex gap-2 text-apoio text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Cancelar entrega ainda não está disponível: hoje o backend não devolve as bolsas ao estoque ao cancelar.
          </p>
        )}
      </section>
    </div>
  )
}

/** PUT do planejamento: distancia e tempo; a rota atual e reenviada intacta. */
function FormularioDePlanejamento({ entrega, aoSalvar }: { entrega: Entrega; aoSalvar: () => void }) {
  const [valores, setValores] = useState<ValoresDePlanejamento>({
    distanciaKm: entrega.distanciaKm === null ? '' : String(entrega.distanciaKm),
    tempoEstimadoMin: entrega.tempoEstimadoMin === null ? '' : String(entrega.tempoEstimadoMin),
  })
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()
  const erros = tentouEnviar ? { ...validarPlanejamento(valores), ...envio.errosDaApi } : envio.errosDaApi
  const alterado =
    numeroOuNulo(valores.distanciaKm) !== entrega.distanciaKm || numeroOuNulo(valores.tempoEstimadoMin) !== entrega.tempoEstimadoMin

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validarPlanejamento(valores)).length > 0) return
    const salva = await envio.executar(
      () =>
        atualizarPlanejamento(entrega.id, {
          rota: entrega.rota,
          distanciaKm: numeroOuNulo(valores.distanciaKm),
          tempoEstimadoMin: numeroOuNulo(valores.tempoEstimadoMin),
        }),
      'Não foi possível salvar o planejamento.',
    )
    if (salva) {
      toast.success('Planejamento salvo')
      aoSalvar()
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-4" aria-labelledby="titulo-planejamento">
      <h3 id="titulo-planejamento" className="text-subtitulo font-semibold">
        Ajustar planejamento
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <Campo id="planejamento-distancia" rotulo="Distância (km)" opcional erro={erros.distanciaKm}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={valores.distanciaKm}
              onChange={(evento) => setValores((atuais) => ({ ...atuais, distanciaKm: evento.target.value }))}
              className="tabular-nums"
            />
          )}
        </Campo>
        <Campo id="planejamento-tempo" rotulo="Tempo (min)" opcional erro={erros.tempoEstimadoMin}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={valores.tempoEstimadoMin}
              onChange={(evento) => setValores((atuais) => ({ ...atuais, tempoEstimadoMin: evento.target.value }))}
              className="tabular-nums"
            />
          )}
        </Campo>
      </div>
      {envio.erro && <Alerta tipo="erro" titulo="A API recusou o planejamento">{envio.erro}</Alerta>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="outline" carregando={envio.enviando} disabled={!alterado}>
          {!envio.enviando && <Save />}
          Salvar planejamento
        </Button>
      </div>
    </form>
  )
}
