'use client'

import {
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CircleCheck,
  LineChart,
  Pencil,
  RotateCw,
  Thermometer,
  Trash2,
  Truck,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { BarraDeFiltros } from '@/components/data-table/barra-de-filtros'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { CartaoDeMetrica } from '@/components/feedback/cartao-de-metrica'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { ConfirmarAcao } from '@/components/form/confirmar-acao'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Alerta, LeituraDeTelemetria, MetricasDeTelemetria, StatusVeiculo, Unidade, Veiculo } from '@/lib/api/tipos'
import { dataHora, numero, plural, rotulo, tomDoVeiculo } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { useSessao } from '../autenticacao/provedor-de-sessao'
import { podeAdministrarRede } from '../autenticacao/sessao'
import { FiltroDePeriodo } from './filtro-de-periodo'
import { FormularioDeVeiculo } from './formulario-de-veiculo'
import { GraficoDeTemperatura } from './grafico-de-temperatura'
import { PainelDeDiagnostico } from './painel-de-diagnostico'
import { caminhoDoHistorico, LEITURAS_NO_GRAFICO, PERIODO_VAZIO, type Periodo } from './telemetria-api'
import { removerVeiculo } from './veiculos-api'

const SITUACOES_DO_VEICULO: StatusVeiculo[] = ['DISPONIVEL', 'EM_ROTA', 'MANUTENCAO']

function tomDoAlerta(nivel: string) {
  return nivel === 'CRITICO' ? 'erro' : nivel === 'ATENCAO' ? 'atencao' : 'neutro'
}

function ListaDeAlertas({ alertas, aoVerVeiculo }: { alertas: Alerta[]; aoVerVeiculo: (id: number) => void }) {
  return (
    <ul className="divide-y">
      {alertas.map((alerta) => (
        <li key={alerta.id} className="flex gap-3 px-6 py-3.5">
          <AlertTriangle
            className={cn(
              'mt-0.5 size-4 shrink-0',
              alerta.nivel === 'CRITICO' ? 'text-critico' : alerta.nivel === 'ATENCAO' ? 'text-atencao' : 'text-muted-foreground',
            )}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{rotulo(alerta.tipo)}</p>
              <Badge tom={tomDoAlerta(alerta.nivel)} ponto={false}>
                {rotulo(alerta.nivel)}
              </Badge>
            </div>
            <p className="mt-0.5 text-rotulo text-muted-foreground">{alerta.mensagem}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-apoio">
              <span className="text-muted-foreground tabular-nums">{dataHora(alerta.criadoEm)}</span>
              {alerta.veiculoId !== null && (
                <button
                  type="button"
                  onClick={() => aoVerVeiculo(alerta.veiculoId as number)}
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  Ver temperatura do veículo
                </button>
              )}
              {alerta.entregaId !== null && (
                <Link href={`/entregas?entrega=${alerta.entregaId}`} className="inline-flex items-center gap-0.5 font-medium underline-offset-2 hover:underline">
                  Entrega #{alerta.entregaId}
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </Link>
              )}
              {alerta.bolsaId !== null && (
                <Link href={`/estoque?bolsa=${alerta.bolsaId}`} className="inline-flex items-center gap-0.5 font-medium underline-offset-2 hover:underline">
                  Bolsa #{alerta.bolsaId}
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Cadeia fria: alertas, temperatura por veiculo e a frota que transporta as bolsas. */
export function PaginaDaCadeiaFria() {
  const { usuario, demonstracao } = useSessao()
  const veDiagnostico = podeAdministrarRede(usuario, demonstracao)

  const [situacao, setSituacao] = useState<StatusVeiculo | ''>('')
  const veiculos = useRecurso<Veiculo[]>('/veiculos')
  const alertas = useRecurso<Alerta[]>('/alertas')
  const metricas = useRecurso<MetricasDeTelemetria>(veDiagnostico ? '/telemetrias/metricas' : null)
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')

  const [veiculoId, setVeiculoId] = useState('')
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_VAZIO)
  const leituras = useRecurso<LeituraDeTelemetria[]>(veiculoId ? caminhoDoHistorico(veiculoId, periodo) : null)

  const [editando, setEditando] = useState<Veiculo | null>(null)
  const [removendo, setRemovendo] = useState<Veiculo | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erroDaRemocao, setErroDaRemocao] = useState<string | null>(null)

  const todos = veiculos.dados ?? []
  const filtrados = situacao ? todos.filter((veiculo) => veiculo.status === situacao) : todos
  const frota = usePaginacaoLocal(filtrados, 6)
  const contar = (status: StatusVeiculo) => todos.filter((veiculo) => veiculo.status === status).length
  const listaDeAlertas = alertas.dados ?? []
  const criticos = listaDeAlertas.filter((alerta) => alerta.nivel === 'CRITICO').length

  function recarregarTudo() {
    veiculos.recarregar()
    alertas.recarregar()
    metricas.recarregar()
    leituras.recarregar()
  }

  function verVeiculo(id: number) {
    setVeiculoId(String(id))
    document.getElementById('temperatura')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function confirmarRemocao() {
    if (!removendo) return
    setOcupado(true)
    setErroDaRemocao(null)
    try {
      await removerVeiculo(removendo.id)
      toast.success(`Veículo ${removendo.placa} removido da frota`)
      if (veiculoId === String(removendo.id)) setVeiculoId('')
      setRemovendo(null)
    } catch (falha) {
      setErroDaRemocao(mensagemDeErro(falha, 'Não foi possível remover o veículo.'))
    } finally {
      setOcupado(false)
      veiculos.recarregar()
    }
  }

  const colunasDaFrota: Coluna<Veiculo>[] = [
    {
      id: 'placa',
      cabecalho: 'Placa',
      celula: (veiculo) => <span className="font-mono text-rotulo font-medium">{veiculo.placa}</span>,
      esqueleto: 'w-20',
    },
    { id: 'base', cabecalho: 'Base', celula: (veiculo) => veiculo.hemocentroBaseNome, esqueleto: 'w-32' },
    {
      id: 'capacidade',
      cabecalho: 'Capacidade',
      celula: (veiculo) => <span className="tabular-nums">{veiculo.capacidadeBolsas} bolsas</span>,
      className: 'hidden md:table-cell',
      esqueleto: 'w-16',
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (veiculo) => <Badge tom={tomDoVeiculo(veiculo.status)}>{rotulo(veiculo.status)}</Badge>,
      esqueleto: 'w-20',
    },
    {
      id: 'acoes',
      cabecalho: <span className="sr-only">Ações</span>,
      celula: (veiculo) => {
        const emRota = veiculo.status === 'EM_ROTA'
        const motivo = emRota ? 'Indisponível enquanto o veículo está em rota' : undefined
        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={emRota ? `${veiculo.placa}: edição indisponível em rota` : `Editar ${veiculo.placa}`}
              title={motivo}
              disabled={emRota}
              onClick={() => setEditando(veiculo)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={emRota ? `${veiculo.placa}: remoção indisponível em rota` : `Remover ${veiculo.placa}`}
              title={motivo}
              disabled={emRota}
              onClick={() => {
                setErroDaRemocao(null)
                setRemovendo(veiculo)
              }}
            >
              <Trash2 />
            </Button>
          </div>
        )
      },
      className: 'w-24 text-right',
      esqueleto: 'ml-auto w-16',
    },
  ]

  const totalDeLeituras = leituras.dados?.length ?? 0

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Cadeia fria"
        descricao="Alertas, temperatura dos veículos e a frota que transporta as bolsas."
        acoes={
          <Button variant="outline" size="sm" onClick={recarregarTudo}>
            <RotateCw />
            Atualizar
          </Button>
        }
      />

      <AvisoAcademico complemento="A faixa de 2 °C a 6 °C é didática e a telemetria é simulada." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoDeMetrica
          rotulo="Alertas ativos"
          icone={BellRing}
          destaque={criticos > 0}
          carregando={alertas.carregando && !alertas.dados}
          valor={alertas.erro ? '—' : numero(listaDeAlertas.length)}
          contexto={alertas.erro ? 'Alertas indisponíveis' : criticos > 0 ? plural(criticos, 'crítico', 'críticos') : 'Nenhum crítico'}
        />
        <CartaoDeMetrica
          rotulo="Disponíveis"
          icone={CircleCheck}
          carregando={veiculos.carregando && !veiculos.dados}
          valor={veiculos.erro ? '—' : numero(contar('DISPONIVEL'))}
          contexto="Prontos para nova entrega"
        />
        <CartaoDeMetrica
          rotulo="Em rota"
          icone={Truck}
          carregando={veiculos.carregando && !veiculos.dados}
          valor={veiculos.erro ? '—' : numero(contar('EM_ROTA'))}
          contexto="Transportando bolsas agora"
        />
        <CartaoDeMetrica
          rotulo="Em manutenção"
          icone={Wrench}
          carregando={veiculos.carregando && !veiculos.dados}
          valor={veiculos.erro ? '—' : numero(contar('MANUTENCAO'))}
          contexto="Fora da escala"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card id="temperatura" className="scroll-mt-20">
          <CardHeader>
            <div>
              <CardTitle>Temperatura por veículo</CardTitle>
              <CardDescription>
                O gráfico mostra as {LEITURAS_NO_GRAFICO} leituras mais recentes do período, em ordem de horário.
              </CardDescription>
            </div>
            <Select
              compacto
              aria-label="Selecionar veículo"
              value={veiculoId}
              onChange={(evento) => setVeiculoId(evento.target.value)}
              className="w-full sm:w-44"
            >
              <option value="">Escolha um veículo</option>
              {todos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa}
                </option>
              ))}
            </Select>
          </CardHeader>
          <CardContent className="space-y-5">
            {veiculoId && <FiltroDePeriodo periodo={periodo} aoAplicar={setPeriodo} />}
            {!veiculoId ? (
              <EstadoVazio icone={LineChart} titulo="Nenhum veículo selecionado" descricao="Escolha um veículo para ver o histórico de temperatura." className="py-16" />
            ) : leituras.erro ? (
              <EstadoDeErro mensagem={leituras.erro} aoTentarNovamente={leituras.recarregar} />
            ) : leituras.carregando && !leituras.dados ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : totalDeLeituras === 0 ? (
              <EstadoVazio
                icone={Thermometer}
                titulo="Sem leituras"
                descricao={periodo.de || periodo.ate ? 'Nenhuma leitura neste período.' : 'Este veículo ainda não enviou telemetria.'}
                className="py-16"
              />
            ) : (
              <>
                <GraficoDeTemperatura leituras={leituras.dados ?? []} />
                <p className="text-apoio text-muted-foreground">
                  {totalDeLeituras > LEITURAS_NO_GRAFICO
                    ? `Mostrando ${LEITURAS_NO_GRAFICO} de ${numero(totalDeLeituras)} leituras. Estreite o período para ver trechos mais antigos.`
                    : `${plural(totalDeLeituras, 'leitura')} no período.`}{' '}
                  {(() => {
                    const fora = (leituras.dados ?? []).filter((leitura) => !leitura.dentroDaFaixaDidatica).length
                    return fora > 0 ? (
                      <span className="font-medium text-critico">{plural(fora, 'leitura fora', 'leituras fora')} da faixa.</span>
                    ) : (
                      'Todas dentro da faixa.'
                    )
                  })()}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Alertas ativos</CardTitle>
              <CardDescription>Calculados pelo backend. Não há como resolvê-los pela interface.</CardDescription>
            </div>
          </CardHeader>
          {alertas.erro ? (
            <EstadoDeErro mensagem={alertas.erro} aoTentarNovamente={alertas.recarregar} />
          ) : alertas.carregando && !alertas.dados ? (
            <div className="space-y-4 px-6 py-5">
              {[0, 1, 2].map((indice) => (
                <div key={indice} className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : listaDeAlertas.length === 0 ? (
            <EstadoVazio icone={BellRing} titulo="Nenhum alerta ativo" descricao="Tudo dentro da faixa no momento." />
          ) : (
            <div className="max-h-[420px] overflow-y-auto">
              <ListaDeAlertas alertas={listaDeAlertas} aoVerVeiculo={verVeiculo} />
            </div>
          )}
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div>
              <CardTitle>Frota</CardTitle>
              <CardDescription>Veículos das bases que sua conta enxerga. Em rota, não dá para editar nem remover.</CardDescription>
            </div>
          </CardHeader>
          <BarraDeFiltros className="border-t" ativos={situacao ? 1 : 0} aoLimpar={() => setSituacao('')}>
            <Select
              compacto
              aria-label="Filtrar por situação"
              value={situacao}
              onChange={(evento) => {
                setSituacao(evento.target.value as StatusVeiculo | '')
                frota.setPagina(0)
              }}
              className="sm:w-48"
            >
              <option value="">Todas as situações</option>
              {SITUACOES_DO_VEICULO.map((valor) => (
                <option key={valor} value={valor}>
                  {rotulo(valor)}
                </option>
              ))}
            </Select>
          </BarraDeFiltros>
          <TabelaDeDados
            colunas={colunasDaFrota}
            linhas={frota.itensDaPagina}
            chave={(veiculo) => veiculo.id}
            carregando={veiculos.carregando}
            erro={veiculos.erro}
            aoTentarNovamente={veiculos.recarregar}
            linhasDoEsqueleto={4}
            vazio={
              <EstadoVazio
                titulo={situacao ? `Nenhum veículo ${rotulo(situacao).toLowerCase()}` : 'Nenhum veículo cadastrado'}
                descricao={situacao ? 'Troque ou limpe o filtro.' : 'Cadastre o primeiro no formulário ao lado.'}
              />
            }
            rodape={
              frota.totalPaginas > 1 && (
                <Paginacao
                  pagina={frota.pagina}
                  totalPaginas={frota.totalPaginas}
                  totalItens={frota.totalItens}
                  tamanho={frota.tamanho}
                  aoMudar={frota.setPagina}
                />
              )
            }
          />
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cadastrar veículo</CardTitle>
              <CardDescription>Entra na frota como disponível.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {hemocentros.carregando && !hemocentros.dados ? (
              <div className="space-y-5">
                {[0, 1].map((indice) => (
                  <div key={indice} className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : hemocentros.erro ? (
              <EstadoDeErro mensagem={hemocentros.erro} aoTentarNovamente={hemocentros.recarregar} className="py-6" />
            ) : (hemocentros.dados ?? []).length === 0 ? (
              <EstadoVazio
                titulo="Nenhum hemocentro disponível"
                descricao="Todo veículo tem um hemocentro de base. Sua conta precisa estar vinculada a um."
                className="py-6"
              />
            ) : (
              <FormularioDeVeiculo hemocentros={hemocentros.dados ?? []} aoSalvar={veiculos.recarregar} />
            )}
          </CardContent>
        </Card>
      </div>

      {veDiagnostico && <PainelDeDiagnostico metricas={metricas} />}

      <Sheet
        aberto={editando !== null}
        aoMudar={(aberto) => !aberto && setEditando(null)}
        titulo={editando ? `Editar ${editando.placa}` : ''}
        descricao="A situação muda pelas etapas da entrega, não por aqui."
      >
        {editando && (
          <FormularioDeVeiculo
            key={editando.id}
            veiculo={editando}
            hemocentros={hemocentros.dados ?? []}
            aoSalvar={() => {
              setEditando(null)
              veiculos.recarregar()
            }}
          />
        )}
      </Sheet>

      <ConfirmarAcao
        aberto={removendo !== null}
        titulo={`Remover o veículo ${removendo?.placa ?? ''}?`}
        descricao="Ele sai da frota. Se já tiver entregas ou telemetria registradas, a API recusa a remoção para preservar a trilha da cadeia fria."
        rotuloDaAcao="Remover veículo"
        ocupado={ocupado}
        erro={erroDaRemocao}
        aoConfirmar={confirmarRemocao}
        aoFechar={() => setRemovendo(null)}
      />
    </div>
  )
}
