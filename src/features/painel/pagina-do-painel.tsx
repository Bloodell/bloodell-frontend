'use client'

import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  Boxes,
  ClipboardList,
  Clock,
  Droplet,
  RotateCw,
  Sparkles,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { CartaoDeMetrica } from '@/components/feedback/cartao-de-metrica'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api, mensagemDeErro } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Alerta, Entrega, IndicadorDeDemanda, IndicadorDeEstoque, IndicadorDeTempos } from '@/lib/api/tipos'
import { numero, rotulo, tomDaEntrega } from '@/lib/formatos'
import { DemandaPorPrioridade } from './demanda-por-prioridade'
import { GraficoPorTipo } from './grafico-por-tipo'

const ATALHOS = [
  { caminho: '/doacoes', rotulo: 'Registrar doação', descricao: 'Gera bolsas no estoque', icone: Droplet },
  { caminho: '/requisicoes', rotulo: 'Nova requisição', descricao: 'Pedido de um hospital', icone: ClipboardList },
  { caminho: '/estoque', rotulo: 'Consultar estoque', descricao: 'Bolsas e validade', icone: Boxes },
]

// O cenario de demonstracao so existe com o perfil de demo do backend.
const PODE_CRIAR_CENARIO = process.env.NODE_ENV === 'development'

export function PaginaDoPainel() {
  const estoque = useRecurso<IndicadorDeEstoque>('/indicadores/estoque')
  const demanda = useRecurso<IndicadorDeDemanda>('/indicadores/demanda')
  const tempos = useRecurso<IndicadorDeTempos>('/indicadores/tempos')
  const entregas = useRecurso<Entrega[]>('/entregas')
  const alertas = useRecurso<Alerta[]>('/alertas')
  const [criandoCenario, setCriandoCenario] = useState(false)

  const recursos = [estoque, demanda, tempos, entregas, alertas]
  const recarregarTudo = () => recursos.forEach((recurso) => recurso.recarregar())

  const emRota = (entregas.dados ?? []).filter((item) => item.status === 'DESPACHADA' || item.status === 'EM_TRANSPORTE')
  const semDados =
    estoque.dados !== null &&
    demanda.dados !== null &&
    estoque.dados.totalDeBolsasDisponiveis === 0 &&
    demanda.dados.totalDeRequisicoes === 0

  async function criarCenario() {
    setCriandoCenario(true)
    try {
      await api.enviar('/demonstracoes/cenarios', { cenario: 'aula', semente: 42 })
      toast.success('Cenário sintético criado', { description: 'Semente 42: os dados são sempre os mesmos.' })
      recarregarTudo()
    } catch (falha) {
      toast.error('Não foi possível criar o cenário', {
        description: mensagemDeErro(falha, 'Confira se a demonstração está habilitada no backend.'),
      })
    } finally {
      setCriandoCenario(false)
    }
  }

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Visão geral"
        descricao="A operação da rede de sangue em um só lugar: estoque, demanda, entregas e cadeia fria. Todos os números vêm da API."
        acoes={
          <Button variant="outline" size="sm" onClick={recarregarTudo}>
            <RotateCw />
            Atualizar
          </Button>
        }
      />

      <AvisoAcademico />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoDeMetrica
          rotulo="Bolsas disponíveis"
          icone={Droplet}
          destaque
          carregando={estoque.carregando && !estoque.dados}
          valor={estoque.dados ? numero(estoque.dados.totalDeBolsasDisponiveis) : '—'}
          contexto={estoque.erro ? 'Consulta indisponível' : 'Prontas para alocação'}
        />
        <CartaoDeMetrica
          rotulo="Requisições"
          icone={ClipboardList}
          carregando={demanda.carregando && !demanda.dados}
          valor={demanda.dados ? numero(demanda.dados.totalDeRequisicoes) : '—'}
          contexto={tempos.dados ? `${numero(tempos.dados.requisicoesNaFila)} aguardando na fila` : 'Registradas no total'}
        />
        <CartaoDeMetrica
          rotulo="Entregas em rota"
          icone={Truck}
          carregando={entregas.carregando && !entregas.dados}
          valor={entregas.erro ? '—' : numero(emRota.length)}
          contexto="Despachadas ou em transporte"
        />
        <CartaoDeMetrica
          rotulo="Alertas ativos"
          icone={BellRing}
          carregando={alertas.carregando && !alertas.dados}
          valor={alertas.erro ? '—' : numero(alertas.dados?.length ?? 0)}
          contexto="Cadeia fria e operação"
        />
      </div>

      {semDados && (
        <Card className="border-dashed">
          <EstadoVazio
            icone={Sparkles}
            titulo="A rede ainda não tem dados"
            descricao="Cadastre unidades e registre uma doação para começar. Em desenvolvimento, dá para gerar um cenário sintético completo."
            acao={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/unidades" className="text-sm font-medium underline-offset-4 hover:underline">
                  Cadastrar unidades
                </Link>
                {PODE_CRIAR_CENARIO && (
                  <Button size="sm" variant="outline" carregando={criandoCenario} onClick={criarCenario}>
                    {!criandoCenario && <Sparkles />}
                    Criar cenário sintético
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Estoque por tipo sanguíneo</CardTitle>
              <CardDescription>Bolsas disponíveis: tipos positivos em verde, negativos em vermelho.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {estoque.erro ? (
              <EstadoDeErro mensagem={estoque.erro} aoTentarNovamente={estoque.recarregar} />
            ) : !estoque.dados ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : (
              <GraficoPorTipo dados={estoque.dados.porTipoSanguineo} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Demanda por prioridade</CardTitle>
              <CardDescription>Todas as requisições registradas.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {demanda.erro ? (
              <EstadoDeErro mensagem={demanda.erro} aoTentarNovamente={demanda.recarregar} />
            ) : !demanda.dados ? (
              <div className="space-y-6">
                {[0, 1, 2].map((indice) => (
                  <div key={indice} className="space-y-2.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ))}
              </div>
            ) : demanda.dados.totalDeRequisicoes === 0 ? (
              <EstadoVazio icone={BarChart3} titulo="Sem requisições" className="py-8" />
            ) : (
              <DemandaPorPrioridade dados={demanda.dados.porPrioridade} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Entregas em rota</CardTitle>
              <CardDescription>As quatro mais recentes.</CardDescription>
            </div>
            <Link href="/entregas" className="text-[13px] font-medium text-muted-foreground hover:text-foreground">
              Ver todas
            </Link>
          </CardHeader>
          {entregas.erro ? (
            <EstadoDeErro mensagem={entregas.erro} aoTentarNovamente={entregas.recarregar} className="py-8" />
          ) : !entregas.dados ? (
            <div className="space-y-4 px-6 py-5">
              {[0, 1, 2].map((indice) => (
                <Skeleton key={indice} className="h-8 w-full" />
              ))}
            </div>
          ) : emRota.length === 0 ? (
            <EstadoVazio icone={Truck} titulo="Nenhuma entrega em rota" className="py-10" />
          ) : (
            <ul className="divide-y">
              {emRota.slice(0, 4).map((entrega) => (
                <li key={entrega.id} className="flex items-center justify-between gap-3 px-6 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px]">{entrega.requisicaoCodigo}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entrega.veiculoPlaca} · {entrega.origemNome}
                    </p>
                  </div>
                  <Badge tom={tomDaEntrega(entrega.status)}>{rotulo(entrega.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tempo até o atendimento</CardTitle>
              <CardDescription>Média das requisições já atendidas.</CardDescription>
            </div>
            <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {tempos.erro ? (
              <EstadoDeErro mensagem={tempos.erro} aoTentarNovamente={tempos.recarregar} className="py-6" />
            ) : !tempos.dados ? (
              <Skeleton className="h-16 w-40" />
            ) : tempos.dados.requisicoesAtendidas === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma requisição atendida ainda.</p>
            ) : (
              <>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                  {numero(Math.round(tempos.dados.tempoAteAtendimento.media))}
                  <span className="ml-1.5 text-base font-normal text-muted-foreground">{tempos.dados.unidade}</span>
                </p>
                <dl className="mt-5 grid grid-cols-3 gap-3 border-t pt-4 text-xs">
                  {[
                    ['Mediana', tempos.dados.tempoAteAtendimento.mediana],
                    ['Mínimo', tempos.dados.tempoAteAtendimento.minimo],
                    ['Máximo', tempos.dados.tempoAteAtendimento.maximo],
                  ].map(([nome, valor]) => (
                    <div key={nome}>
                      <dt className="text-muted-foreground">{nome}</dt>
                      <dd className="mt-1 font-medium tabular-nums">{numero(Math.round(Number(valor)))}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Sobre {numero(tempos.dados.requisicoesAtendidas)} requisição(ões) atendida(s).
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Acesso rápido</CardTitle>
              <CardDescription>Os fluxos principais da operação.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {ATALHOS.map(({ caminho, rotulo: nome, descricao, icone: Icone }) => (
              <Link
                key={caminho}
                href={caminho}
                className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <span className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <Icone className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{nome}</span>
                  <span className="block text-xs text-muted-foreground">{descricao}</span>
                </span>
                <ArrowUpRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
