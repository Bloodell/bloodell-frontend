'use client'

import { Camera, CircleCheck, CircleDashed, Layers, ListOrdered, Rows3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import { useRecurso } from '@/lib/api/use-recurso'
import type { SituacaoDoModuloAed, SnapshotDaFila, SnapshotDaLista, SnapshotDaPilha } from '@/lib/api/tipos'
import { data, rotulo, tomDaPrioridade, tomDoEstadoDaBolsa } from '@/lib/formatos'
import { Encadeamento, EsqueletoDeNos, No } from './nos'

const hora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR')

/** Card padrao de uma estrutura: cabecalho com metadados, nos e a observacao do backend. */
function CartaoDeEstrutura<T extends { tamanho: number; capturadoEm: string; observacao: string; nos: unknown[] }>({
  titulo,
  icone: Icone,
  recurso,
  detalhe,
  vazio,
  children,
}: {
  titulo: string
  icone: typeof Rows3
  recurso: EstadoDoRecurso<T>
  detalhe: (dados: T) => string
  vazio: string
  children: (dados: T) => ReactNode
}) {
  const dados = recurso.dados
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Icone className="size-4 text-muted-foreground" aria-hidden="true" />
            {titulo}
          </CardTitle>
          <CardDescription>
            {dados ? `${dados.tamanho} nó(s) · ${detalhe(dados)} · capturado às ${hora(dados.capturadoEm)}` : 'Capturando…'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recurso.erro ? (
          <EstadoDeErro mensagem={recurso.erro} aoTentarNovamente={recurso.recarregar} className="py-8" />
        ) : !dados ? (
          <EsqueletoDeNos />
        ) : dados.nos.length === 0 ? (
          <EstadoVazio titulo={vazio} className="py-8" />
        ) : (
          children(dados)
        )}
        {dados?.observacao && <p className="text-xs leading-relaxed text-muted-foreground">{dados.observacao}</p>}
      </CardContent>
    </Card>
  )
}

/**
 * Visualizador das estruturas implementadas a mao. O que aparece e o retrato
 * de uma execucao real: o backend monta lista, fila e pilha a partir do banco.
 */
export function PaginaDeAlgoritmos() {
  const lista = useRecurso<SnapshotDaLista>('/algoritmos/estoque')
  const fila = useRecurso<SnapshotDaFila>('/algoritmos/fila')
  const pilha = useRecurso<SnapshotDaPilha>('/algoritmos/historico')
  const situacao = useRecurso<SituacaoDoModuloAed>('/algoritmos/situacao')

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Estruturas de dados"
        descricao="Lista encadeada, fila de prioridade e pilha implementadas à mão, com os nós que vieram do banco."
        acoes={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              lista.recarregar()
              fila.recarregar()
              pilha.recarregar()
            }}
          >
            <Camera />
            Capturar novamente
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
          {situacao.erro ? (
            <EstadoDeErro mensagem={situacao.erro} aoTentarNovamente={situacao.recarregar} className="py-6 md:col-span-2" />
          ) : !situacao.dados ? (
            [0, 1].map((indice) => (
              <div key={indice} className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            ))
          ) : (
            <>
              <div>
                <p className="text-sm font-medium">Implementado · Unidade {situacao.dados.etapaVigente}</p>
                <ul className="mt-3 space-y-2">
                  {situacao.dados.implementados.map((item) => (
                    <li key={item} className="flex gap-2 text-[13px]">
                      <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium">Ainda não implementado · Unidade 2</p>
                <ul className="mt-3 space-y-2">
                  {situacao.dados.pendentesDaUnidadeDois.map((item) => (
                    <li key={item} className="flex gap-2 text-[13px] text-muted-foreground">
                      <CircleDashed className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="border-t pt-4 text-xs text-muted-foreground md:col-span-2">{situacao.dados.observacao}</p>
            </>
          )}
        </CardContent>
      </Card>

      <CartaoDeEstrutura
        titulo="Lista encadeada · estoque"
        icone={Rows3}
        recurso={lista}
        detalhe={(dados) => `ordem: ${dados.ordem}`}
        vazio="A lista está vazia: nenhuma bolsa no estoque."
      >
        {(dados) => (
          <>
            <Encadeamento>
              {dados.nos.slice(0, 24).map((no) => (
                <No key={no.codigo} titulo={no.codigo}>
                  <p>
                    <span className="font-mono font-semibold text-foreground">{no.tipoSanguineo}</span> · {rotulo(no.componente)}
                  </p>
                  <p>vence {data(no.dataValidade)}</p>
                  <Badge tom={tomDoEstadoDaBolsa(no.status)} className="mt-1">
                    {rotulo(no.status)}
                  </Badge>
                </No>
              ))}
            </Encadeamento>
            {dados.nos.length > 24 && (
              <p className="text-xs text-muted-foreground">Mostrando os 24 primeiros nós de {dados.tamanho}.</p>
            )}
          </>
        )}
      </CartaoDeEstrutura>

      <CartaoDeEstrutura
        titulo="Fila de prioridade · requisições"
        icone={ListOrdered}
        recurso={fila}
        detalhe={(dados) => dados.politica}
        vazio="A fila está vazia: nenhuma requisição aguardando."
      >
        {(dados) => (
          <Encadeamento>
            {dados.nos.map((no, indice) => (
              <No key={no.codigo} titulo={`${no.posicao}º · ${no.codigo}`} destaque={indice === 0}>
                <p className="truncate">{no.hospital}</p>
                <Badge tom={tomDaPrioridade(no.prioridade)} className="mt-1">
                  {rotulo(no.prioridade)}
                </Badge>
              </No>
            ))}
          </Encadeamento>
        )}
      </CartaoDeEstrutura>

      <CartaoDeEstrutura
        titulo="Pilha · histórico de eventos"
        icone={Layers}
        recurso={pilha}
        detalhe={(dados) => dados.ordem}
        vazio="A pilha está vazia: nenhum evento registrado."
      >
        {(dados) => (
          <ol className="max-w-md space-y-1.5">
            {dados.nos.slice(0, 12).map((no) => (
              <li
                key={`${no.codigoBolsa}-${no.posicaoDoTopo}`}
                className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 shadow-xs first:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-medium">
                    {no.posicaoDoTopo === 1 && <span className="mr-1.5 font-sans text-[11px] text-muted-foreground">topo</span>}
                    {no.codigoBolsa}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {no.statusAnterior ? `${rotulo(no.statusAnterior)} → ` : ''}
                    {rotulo(no.statusNovo)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{hora(no.ocorridoEm)}</span>
              </li>
            ))}
          </ol>
        )}
      </CartaoDeEstrutura>
    </div>
  )
}
