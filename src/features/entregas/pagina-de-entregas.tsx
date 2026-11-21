'use client'

import { CheckCircle2, ChevronRight, ClipboardCheck, RotateCw, Route, Truck } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { BarraDeFiltros } from '@/components/data-table/barra-de-filtros'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { CartaoDeMetrica } from '@/components/feedback/cartao-de-metrica'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Entrega, StatusEntrega, Unidade, Veiculo } from '@/lib/api/tipos'
import { rotulo, tomDaEntrega } from '@/lib/formatos'
import { avancarEntrega, PROXIMA_ETAPA, STATUS_ATIVOS_DA_ENTREGA } from './entregas-api'
import { FormularioDeEntrega } from './formulario-de-entrega'
import { PainelDeEntrega } from './painel-de-entrega'
import { interpretarRota } from './rota-planejada'

const SITUACOES: StatusEntrega[] = ['PLANEJADA', 'DESPACHADA', 'EM_TRANSPORTE', 'ENTREGUE', 'CANCELADA']

function idDaQuery(valor: string | null): number | null {
  const numero = Number(valor)
  return valor && Number.isInteger(numero) && numero > 0 ? numero : null
}

export function PaginaDeEntregas() {
  const router = useRouter()
  const caminho = usePathname()
  const parametros = useSearchParams()
  // Links de outras telas: ?entrega=ID abre o detalhe; ?requisicao=ID abre o planejamento.
  const entregaDaQuery = idDaQuery(parametros.get('entrega'))
  const requisicaoDaQuery = idDaQuery(parametros.get('requisicao'))

  const [filtro, setFiltro] = useState<StatusEntrega | ''>('')
  const [avancando, setAvancando] = useState<number | null>(null)
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const [planejando, setPlanejando] = useState(false)

  const todas = useRecurso<Entrega[]>('/entregas')
  const veiculos = useRecurso<Veiculo[]>('/veiculos')
  const origens = useRecurso<Unidade[]>('/hemocentros')

  const entregas = todas.dados ?? []
  const filtradas = filtro ? entregas.filter((entrega) => entrega.status === filtro) : entregas
  const paginacao = usePaginacaoLocal([...filtradas].sort((a, b) => b.id - a.id), 8)
  const contar = (...status: StatusEntrega[]) => entregas.filter((entrega) => status.includes(entrega.status)).length
  const comEntregaAtiva = new Set(entregas.filter((entrega) => STATUS_ATIVOS_DA_ENTREGA.includes(entrega.status)).map((entrega) => entrega.requisicaoId))

  const detalheAberto = selecionada ?? entregaDaQuery
  const formularioAberto = planejando || requisicaoDaQuery !== null

  function limparQuery() {
    if (entregaDaQuery !== null || requisicaoDaQuery !== null) router.replace(caminho)
  }

  function recarregarTudo() {
    todas.recarregar()
    veiculos.recarregar()
  }

  async function avancar(entrega: Entrega) {
    const etapa = PROXIMA_ETAPA[entrega.status]
    if (!etapa) return
    setAvancando(entrega.id)
    try {
      await avancarEntrega(entrega)
      toast.success(`Entrega da ${entrega.requisicaoCodigo}: ${etapa.rotulo.toLowerCase()}`, { description: etapa.efeito })
    } catch (falha) {
      toast.error('Não foi possível atualizar a entrega', {
        description: mensagemDeErro(falha, 'Erro inesperado ao atualizar a entrega.'),
      })
    } finally {
      setAvancando(null)
      recarregarTudo()
    }
  }

  const colunas: Coluna<Entrega>[] = [
    {
      id: 'requisicao',
      cabecalho: 'Requisição',
      celula: (entrega) => <span className="font-mono text-rotulo">{entrega.requisicaoCodigo}</span>,
      esqueleto: 'w-28',
    },
    {
      id: 'origem',
      cabecalho: 'Origem',
      celula: (entrega) => entrega.origemNome,
      className: 'hidden md:table-cell',
      esqueleto: 'w-32',
    },
    {
      id: 'veiculo',
      cabecalho: 'Veículo',
      celula: (entrega) => <span className="font-mono text-rotulo">{entrega.veiculoPlaca}</span>,
      esqueleto: 'w-20',
    },
    {
      id: 'rota',
      cabecalho: 'Rota',
      celula: (entrega) => {
        const rota = interpretarRota(entrega.rota)
        if (rota) {
          const destino = rota.paradas[rota.paradas.length - 1]
          return (
            <span className="line-clamp-1 max-w-56">
              até {destino.nome}
              {entrega.distanciaKm !== null && <span className="text-muted-foreground tabular-nums"> · {Math.round(entrega.distanciaKm * 10) / 10} km</span>}
            </span>
          )
        }
        return <span className="text-muted-foreground">{entrega.rota ? 'Formato não reconhecido' : 'Não calculada'}</span>
      },
      className: 'hidden lg:table-cell',
      esqueleto: 'w-40',
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (entrega) => <Badge tom={tomDaEntrega(entrega.status)}>{rotulo(entrega.status)}</Badge>,
      esqueleto: 'w-24',
    },
    {
      id: 'acao',
      cabecalho: <span className="sr-only">Ações</span>,
      celula: (entrega) => {
        const etapa = PROXIMA_ETAPA[entrega.status]
        return (
          <div className="flex items-center justify-end gap-1">
            {etapa && (
              <Button
                variant="outline"
                size="sm"
                carregando={avancando === entrega.id}
                disabled={avancando !== null && avancando !== entrega.id}
                onClick={() => avancar(entrega)}
              >
                {etapa.rotulo}
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => setSelecionada(entrega.id)} aria-label={`Abrir entrega da ${entrega.requisicaoCodigo}`}>
              <ChevronRight />
            </Button>
          </div>
        )
      },
      className: 'w-48 text-right',
      esqueleto: 'ml-auto w-28',
    },
  ]

  const carregandoFormulario = (veiculos.carregando && !veiculos.dados) || (origens.carregando && !origens.dados)
  const erroDoFormulario = veiculos.erro ?? origens.erro

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Entregas"
        descricao="Planejamento e acompanhamento das entregas, da saída do hemocentro até o hospital."
        acoes={
          <>
            <Button variant="outline" size="sm" onClick={recarregarTudo}>
              <RotateCw />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setPlanejando(true)}>
              <Route />
              Planejar entrega
            </Button>
          </>
        }
      />

      <AvisoAcademico complemento="A distância calculada pelo backend é em linha reta, não pelas ruas." />

      <div className="grid gap-4 sm:grid-cols-3">
        <CartaoDeMetrica rotulo="Planejadas" icone={ClipboardCheck} carregando={todas.carregando && !todas.dados} valor={contar('PLANEJADA')} contexto="Aguardando despacho" />
        <CartaoDeMetrica rotulo="Em rota" icone={Truck} carregando={todas.carregando && !todas.dados} valor={contar('DESPACHADA', 'EM_TRANSPORTE')} contexto="Despachadas ou em transporte" />
        <CartaoDeMetrica rotulo="Entregues" icone={CheckCircle2} carregando={todas.carregando && !todas.dados} valor={contar('ENTREGUE')} contexto="Concluídas" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Acompanhamento</CardTitle>
            <CardDescription>Avance cada entrega pela próxima etapa ou abra o detalhe para calcular a rota.</CardDescription>
          </div>
        </CardHeader>
        <BarraDeFiltros className="border-t" ativos={filtro ? 1 : 0} aoLimpar={() => setFiltro('')}>
          <Select
            compacto
            aria-label="Filtrar por situação"
            value={filtro}
            onChange={(evento) => {
              setFiltro(evento.target.value as StatusEntrega | '')
              paginacao.setPagina(0)
            }}
            className="sm:w-48"
          >
            <option value="">Todas as situações</option>
            {SITUACOES.map((valor) => (
              <option key={valor} value={valor}>
                {rotulo(valor)}
              </option>
            ))}
          </Select>
        </BarraDeFiltros>
        <TabelaDeDados
          colunas={colunas}
          linhas={paginacao.itensDaPagina}
          chave={(entrega) => entrega.id}
          carregando={todas.carregando}
          erro={todas.erro}
          aoTentarNovamente={todas.recarregar}
          linhasDoEsqueleto={5}
          vazio={
            <EstadoVazio
              icone={Truck}
              titulo={filtro ? 'Nenhuma entrega nesta situação' : 'Nenhuma entrega planejada'}
              descricao={filtro ? 'Escolha outra situação ou limpe o filtro.' : 'Quando uma requisição estiver alocada, planeje a entrega dela.'}
              acao={
                filtro ? undefined : (
                  <Button size="sm" onClick={() => setPlanejando(true)}>
                    <Route />
                    Planejar entrega
                  </Button>
                )
              }
            />
          }
          rodape={
            paginacao.totalPaginas > 1 && (
              <Paginacao
                pagina={paginacao.pagina}
                totalPaginas={paginacao.totalPaginas}
                totalItens={paginacao.totalItens}
                tamanho={paginacao.tamanho}
                aoMudar={paginacao.setPagina}
              />
            )
          }
        />
      </Card>

      <Sheet
        aberto={formularioAberto}
        aoMudar={(aberto) => {
          if (!aberto) {
            setPlanejando(false)
            limparQuery()
          }
        }}
        titulo="Planejar entrega"
        descricao="Para requisições com bolsas já alocadas."
        className="max-w-xl"
      >
        {carregandoFormulario ? (
          <div className="space-y-5">
            {[0, 1, 2].map((indice) => (
              <Skeleton key={indice} className="h-14 w-full" />
            ))}
          </div>
        ) : erroDoFormulario ? (
          <EstadoDeErro mensagem={erroDoFormulario} aoTentarNovamente={() => [veiculos, origens].forEach((r) => r.recarregar())} />
        ) : (
          <FormularioDeEntrega
            key={requisicaoDaQuery ?? 'nova'}
            veiculos={veiculos.dados ?? []}
            origens={origens.dados ?? []}
            comEntregaAtiva={comEntregaAtiva}
            requisicaoInicial={requisicaoDaQuery}
            aoPlanejar={(entrega) => {
              setPlanejando(false)
              limparQuery()
              recarregarTudo()
              setSelecionada(entrega.id)
            }}
          />
        )}
      </Sheet>

      <PainelDeEntrega
        entregaId={formularioAberto ? null : detalheAberto}
        aoFechar={() => {
          setSelecionada(null)
          limparQuery()
        }}
        aoMudar={recarregarTudo}
      />
    </div>
  )
}
