'use client'

import { ArrowUpRight, Ban, Info, Play, Save } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { EstadoDeErro } from '@/components/feedback/estados'
import { Alerta } from '@/components/form/alerta'
import { ConfirmarAcao } from '@/components/form/confirmar-acao'
import { GrupoDeOpcoes } from '@/components/form/opcoes'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Separator, Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro, statusDaFalha } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Prioridade, Requisicao, ResultadoDaAlocacao } from '@/lib/api/tipos'
import { dataHora, PRIORIDADES, plural, rotulo, tomDaPrioridade, tomDoStatusDaRequisicao } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { COR_DA_PRIORIDADE } from './formulario-de-requisicao'
import {
  alterarPrioridade,
  cancelarRequisicao,
  pendencias,
  podeAlterarPrioridade,
  podeCancelar,
  podeProcessar,
  processarAlocacao,
} from './requisicoes-api'

/** Barra solicitado x alocado. Texto ao lado: a barra nunca e o unico sinal. */
function Atendimento({ alocado, total }: { alocado: number; total: number }) {
  const fracao = total > 0 ? Math.min(1, alocado / total) : 0
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span
          className={cn('block h-full rounded-full', fracao >= 1 ? 'bg-estavel' : fracao > 0 ? 'bg-atencao' : 'bg-transparent')}
          style={{ width: `${fracao * 100}%` }}
        />
      </span>
      <span className="text-apoio tabular-nums">
        {alocado} de {total}
      </span>
    </span>
  )
}

export function PainelDeRequisicao({
  requisicaoId,
  aoFechar,
  aoMudar,
  aoProcessar,
}: {
  requisicaoId: number | null
  aoFechar: () => void
  /** Algo mudou no servidor: a lista e a fila precisam recarregar. */
  aoMudar: () => void
  aoProcessar: (resultado: ResultadoDaAlocacao) => void
}) {
  const detalhe = useRecurso<Requisicao>(requisicaoId === null ? null : `/requisicoes/${requisicaoId}`)
  const requisicao = detalhe.dados

  return (
    <Sheet
      aberto={requisicaoId !== null}
      aoMudar={(aberto) => !aberto && aoFechar()}
      titulo={requisicao ? <span className="font-mono">{requisicao.codigo}</span> : 'Requisição'}
      descricao={requisicao ? `${requisicao.hospitalNome} · criada em ${dataHora(requisicao.criadaEm)}` : undefined}
      className="max-w-lg"
    >
      {detalhe.erro ? (
        <EstadoDeErro
          mensagem={detalhe.statusHttp === 404 ? 'Esta requisição não existe mais ou saiu do alcance da sua conta.' : detalhe.erro}
          aoTentarNovamente={detalhe.recarregar}
        />
      ) : !requisicao ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <ConteudoDaRequisicao
          key={`${requisicao.id}-${requisicao.status}-${requisicao.prioridade}`}
          requisicao={requisicao}
          aoMudar={() => {
            detalhe.recarregar()
            aoMudar()
          }}
          aoProcessar={aoProcessar}
          aoFechar={aoFechar}
        />
      )}
    </Sheet>
  )
}

function ConteudoDaRequisicao({
  requisicao,
  aoMudar,
  aoProcessar,
  aoFechar,
}: {
  requisicao: Requisicao
  aoMudar: () => void
  aoProcessar: (resultado: ResultadoDaAlocacao) => void
  aoFechar: () => void
}) {
  const [prioridade, setPrioridade] = useState<Prioridade>(requisicao.prioridade)
  const [salvando, setSalvando] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [erroDoCancelamento, setErroDoCancelamento] = useState<string | null>(null)

  const { total, alocado, faltam } = pendencias(requisicao)
  const ocupado = salvando || processando || cancelando

  /** 422 = a situacao mudou em outra sessao: avisa e recarrega o real. */
  function tratarConflito(falha: unknown, padrao: string) {
    const status = statusDaFalha(falha)
    toast.error(status === 422 || status === 409 ? 'A situação da requisição mudou' : padrao, {
      description: mensagemDeErro(falha, padrao),
    })
    aoMudar()
  }

  async function salvarPrioridade() {
    setSalvando(true)
    try {
      await alterarPrioridade(requisicao.id, prioridade)
      toast.success(`Prioridade de ${requisicao.codigo}: ${rotulo(prioridade)}`, {
        description: 'A fila foi reordenada pelo backend.',
      })
      aoMudar()
    } catch (falha) {
      tratarConflito(falha, 'Não foi possível alterar a prioridade.')
    } finally {
      setSalvando(false)
    }
  }

  async function processar() {
    setProcessando(true)
    try {
      const resultado = await processarAlocacao(requisicao.id)
      aoProcessar(resultado)
      aoMudar()
    } catch (falha) {
      tratarConflito(falha, `Não foi possível processar ${requisicao.codigo}.`)
    } finally {
      setProcessando(false)
    }
  }

  async function cancelar() {
    setCancelando(true)
    setErroDoCancelamento(null)
    try {
      await cancelarRequisicao(requisicao.id)
      toast.success(`Requisição ${requisicao.codigo} cancelada`)
      setConfirmando(false)
      aoMudar()
    } catch (falha) {
      setErroDoCancelamento(mensagemDeErro(falha, 'Não foi possível cancelar a requisição.'))
      aoMudar()
    } finally {
      setCancelando(false)
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tom={tomDaPrioridade(requisicao.prioridade)}>{rotulo(requisicao.prioridade)}</Badge>
        <Badge tom={tomDoStatusDaRequisicao(requisicao.status)}>{rotulo(requisicao.status)}</Badge>
        {requisicao.atendidaEm && <span className="text-apoio text-muted-foreground">atendida em {dataHora(requisicao.atendidaEm)}</span>}
      </div>

      <section aria-labelledby="titulo-itens" className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="titulo-itens" className="text-subtitulo font-semibold">
            Itens pedidos
          </h3>
          <span className="text-apoio text-muted-foreground tabular-nums">
            {alocado} de {plural(total, 'bolsa')} alocadas
          </span>
        </div>
        <ul className="divide-y rounded-lg border">
          {requisicao.itens.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="min-w-0 text-rotulo">
                <span className="tabular-nums">{item.quantidade}×</span>{' '}
                <span className="font-mono font-semibold">{item.tipoSanguineo}</span>{' '}
                <span className="text-muted-foreground">{rotulo(item.componente)}</span>
              </span>
              <Atendimento alocado={Math.min(item.quantidadeAlocada, item.quantidade)} total={item.quantidade} />
            </li>
          ))}
        </ul>
        {faltam > 0 && alocado > 0 && (
          <Alerta tipo="info" titulo={`Atendimento parcial: faltam ${plural(faltam, 'bolsa')}`}>
            O estoque não tinha bolsas compatíveis suficientes no momento da alocação. A API não realoca o saldo
            sozinha.
          </Alerta>
        )}
      </section>

      {podeAlterarPrioridade(requisicao.status) && (
        <section aria-labelledby="titulo-prioridade" className="space-y-3">
          <h3 id="titulo-prioridade" className="text-subtitulo font-semibold">
            Prioridade na fila
          </h3>
          <GrupoDeOpcoes
            nome={`prioridade-${requisicao.id}`}
            rotulo="Prioridade"
            valor={prioridade}
            aoMudar={setPrioridade}
            opcoes={PRIORIDADES.map((opcao) => ({
              valor: opcao.valor,
              rotulo: opcao.rotulo,
              marcador: <span className={cn('size-1.5 rounded-full', COR_DA_PRIORIDADE[opcao.valor])} aria-hidden="true" />,
            }))}
          />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={salvarPrioridade} carregando={salvando} disabled={prioridade === requisicao.prioridade || ocupado}>
              {!salvando && <Save />}
              Salvar prioridade
            </Button>
          </div>
        </section>
      )}

      <Separator />

      <section aria-label="Ações" className="space-y-3">
        {podeProcessar(requisicao.status) && (
          <Button className="w-full" onClick={processar} carregando={processando} disabled={ocupado && !processando}>
            {!processando && <Play />}
            Processar alocação agora
          </Button>
        )}
        {requisicao.status === 'ALOCADA' && (
          <Link href={`/entregas?requisicao=${requisicao.id}`} className={buttonVariants({ className: 'w-full' })} onClick={aoFechar}>
            Planejar a entrega
            <ArrowUpRight />
          </Link>
        )}
        {podeCancelar(requisicao.status) && (
          <Button
            variant="outline"
            className="w-full text-critico hover:text-critico"
            onClick={() => {
              setErroDoCancelamento(null)
              setConfirmando(true)
            }}
            disabled={ocupado}
          >
            <Ban />
            Cancelar requisição
          </Button>
        )}
        {(requisicao.status === 'ALOCADA' || requisicao.status === 'EM_ROTA') && (
          <p className="flex gap-2 text-apoio text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            Cancelar depois da alocação ainda não está disponível: hoje o backend não devolve as bolsas reservadas ao
            estoque nem libera a entrega e o veículo.
          </p>
        )}
      </section>

      <ConfirmarAcao
        aberto={confirmando}
        titulo={`Cancelar ${requisicao.codigo}?`}
        descricao="A requisição sai da fila e não pode ser reaberta. Nenhuma bolsa foi reservada para ela ainda."
        rotuloDaAcao="Cancelar requisição"
        ocupado={cancelando}
        erro={erroDoCancelamento}
        aoConfirmar={cancelar}
        aoFechar={() => setConfirmando(false)}
      />
    </div>
  )
}
