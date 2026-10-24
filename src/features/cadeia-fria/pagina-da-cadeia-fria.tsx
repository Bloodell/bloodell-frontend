'use client'

import { Activity, AlertTriangle, BellRing, Inbox, LineChart, RotateCw, Thermometer } from 'lucide-react'
import { useState } from 'react'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { CartaoDeMetrica } from '@/components/feedback/cartao-de-metrica'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Alerta, LeituraDeTelemetria, MetricasDeTelemetria, Unidade, Veiculo } from '@/lib/api/tipos'
import { dataHora, numero, rotulo } from '@/lib/formatos'
import { FormularioDeVeiculo } from './formulario-de-veiculo'
import { GraficoDeTemperatura } from './grafico-de-temperatura'

const colunasDaFrota: Coluna<Veiculo>[] = [
  {
    id: 'placa',
    cabecalho: 'Placa',
    celula: (veiculo) => <span className="font-mono text-[13px] font-medium">{veiculo.placa}</span>,
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
    celula: (veiculo) => (
      <Badge tom={veiculo.status === 'DISPONIVEL' ? 'sucesso' : 'info'}>{rotulo(veiculo.status)}</Badge>
    ),
    esqueleto: 'w-20',
  },
  {
    id: 'posicao',
    cabecalho: 'Última posição',
    celula: (veiculo) => (
      <span className="font-mono text-xs text-muted-foreground">
        {veiculo.latitude.toFixed(4)}, {veiculo.longitude.toFixed(4)}
      </span>
    ),
    className: 'hidden lg:table-cell text-right',
    esqueleto: 'ml-auto w-32',
  },
]

function ListaDeAlertas({ alertas }: { alertas: Alerta[] }) {
  return (
    <ul className="divide-y">
      {alertas.map((alerta) => (
        <li key={alerta.id} className="flex gap-3 px-6 py-3.5">
          <AlertTriangle
            className={alerta.nivel === 'CRITICO' ? 'mt-0.5 size-4 shrink-0 text-destructive' : 'mt-0.5 size-4 shrink-0 text-amber-500'}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{rotulo(alerta.tipo)}</p>
              <Badge tom={alerta.nivel === 'CRITICO' ? 'erro' : 'atencao'} ponto={false}>
                {rotulo(alerta.nivel)}
              </Badge>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{alerta.mensagem}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">{dataHora(alerta.criadoEm)}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Cadeia fria: alertas, frota e temperaturas recebidas pelo backend. */
export function PaginaDaCadeiaFria() {
  const veiculos = useRecurso<Veiculo[]>('/veiculos')
  const alertas = useRecurso<Alerta[]>('/alertas')
  const metricas = useRecurso<MetricasDeTelemetria>('/telemetrias/metricas')
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const [veiculoId, setVeiculoId] = useState('')
  const leituras = useRecurso<LeituraDeTelemetria[]>(veiculoId ? `/veiculos/${veiculoId}/telemetrias` : null)
  const frota = usePaginacaoLocal(veiculos.dados ?? [], 6)

  function recarregarTudo() {
    veiculos.recarregar()
    alertas.recarregar()
    metricas.recarregar()
    leituras.recarregar()
  }

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Cadeia fria"
        descricao="Temperatura dos veículos, alertas calculados pelo backend e a frota que transporta as bolsas."
        acoes={
          <Button variant="outline" size="sm" onClick={recarregarTudo}>
            <RotateCw />
            Atualizar
          </Button>
        }
      />

      <AvisoAcademico complemento="As faixas de temperatura são didáticas e a telemetria é simulada." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoDeMetrica rotulo="Alertas ativos" icone={BellRing} destaque={(alertas.dados?.length ?? 0) > 0} carregando={alertas.carregando} valor={alertas.erro ? '—' : numero(alertas.dados?.length ?? 0)} contexto="Cadeia fria e operação" />
        <CartaoDeMetrica rotulo="Leituras recebidas" icone={Activity} carregando={metricas.carregando} valor={metricas.dados ? numero(metricas.dados.leiturasRecebidas) : '—'} contexto={metricas.dados ? `${numero(metricas.dados.leiturasPersistidas)} persistidas` : 'Telemetria indisponível'} />
        <CartaoDeMetrica rotulo="Leituras recusadas" icone={AlertTriangle} carregando={metricas.carregando} valor={metricas.dados ? numero(metricas.dados.leiturasRecusadas) : '—'} contexto="Fora do formato esperado" />
        <CartaoDeMetrica rotulo="Na fila de ingestão" icone={Inbox} carregando={metricas.carregando} valor={metricas.dados ? numero(metricas.dados.tamanhoAtualDaFila) : '—'} contexto="Aguardando persistência" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Temperatura por veículo</CardTitle>
              <CardDescription>Últimas 30 leituras do veículo selecionado.</CardDescription>
            </div>
            <Select
              compacto
              aria-label="Selecionar veículo"
              value={veiculoId}
              onChange={(evento) => setVeiculoId(evento.target.value)}
              className="w-full sm:w-44"
            >
              <option value="">Escolha um veículo</option>
              {(veiculos.dados ?? []).map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa}
                </option>
              ))}
            </Select>
          </CardHeader>
          <CardContent>
            {!veiculoId ? (
              <EstadoVazio icone={LineChart} titulo="Nenhum veículo selecionado" descricao="Escolha um veículo para ver o histórico de temperatura." className="py-16" />
            ) : leituras.erro ? (
              <EstadoDeErro mensagem={leituras.erro} aoTentarNovamente={leituras.recarregar} />
            ) : leituras.carregando ? (
              <Skeleton className="h-[240px] w-full rounded-lg" />
            ) : (leituras.dados ?? []).length === 0 ? (
              <EstadoVazio icone={Thermometer} titulo="Sem leituras" descricao="Este veículo ainda não enviou telemetria." className="py-16" />
            ) : (
              <GraficoDeTemperatura leituras={leituras.dados ?? []} />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Alertas ativos</CardTitle>
              <CardDescription>Ocorrências calculadas pelo backend.</CardDescription>
            </div>
          </CardHeader>
          {alertas.erro ? (
            <EstadoDeErro mensagem={alertas.erro} aoTentarNovamente={alertas.recarregar} />
          ) : alertas.carregando ? (
            <div className="space-y-4 px-6 py-5">
              {[0, 1, 2].map((indice) => (
                <div key={indice} className="space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          ) : (alertas.dados ?? []).length === 0 ? (
            <EstadoVazio icone={BellRing} titulo="Nenhum alerta ativo" descricao="Tudo dentro da faixa no momento." />
          ) : (
            <div className="max-h-[340px] overflow-y-auto">
              <ListaDeAlertas alertas={alertas.dados ?? []} />
            </div>
          )}
        </Card>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Frota</CardTitle>
              <CardDescription>Veículos cadastrados e a última posição conhecida.</CardDescription>
            </div>
          </CardHeader>
          <TabelaDeDados
            colunas={colunasDaFrota}
            linhas={frota.itensDaPagina}
            chave={(veiculo) => veiculo.id}
            carregando={veiculos.carregando}
            erro={veiculos.erro}
            aoTentarNovamente={veiculos.recarregar}
            linhasDoEsqueleto={4}
            vazio={<EstadoVazio titulo="Nenhum veículo cadastrado" descricao="Cadastre o primeiro no formulário ao lado." />}
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
            {hemocentros.carregando ? (
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
            ) : (
              <FormularioDeVeiculo hemocentros={hemocentros.dados ?? []} aoCadastrar={veiculos.recarregar} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
