'use client'

import { CheckCircle2, ClipboardCheck, RotateCw, Truck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { BarraDeFiltros } from '@/components/data-table/barra-de-filtros'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { CartaoDeMetrica } from '@/components/feedback/cartao-de-metrica'
import { EstadoVazio } from '@/components/feedback/estados'
import { Alerta } from '@/components/form/alerta'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { api, mensagemDeErro } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Entrega, Pagina, Requisicao, StatusEntrega, Unidade, Veiculo } from '@/lib/api/tipos'
import { rotulo, tomDaEntrega } from '@/lib/formatos'
import { FormularioDeEntrega } from './formulario-de-entrega'

const SITUACOES: StatusEntrega[] = ['PLANEJADA', 'DESPACHADA', 'EM_TRANSPORTE', 'ENTREGUE', 'CANCELADA']

/** Proxima etapa de cada situacao: endpoint e rotulo do botao. */
const PROXIMA_ETAPA: Partial<Record<StatusEntrega, { caminho: string; rotulo: string }>> = {
  PLANEJADA: { caminho: 'despacho', rotulo: 'Despachar' },
  DESPACHADA: { caminho: 'inicio-transporte', rotulo: 'Iniciar transporte' },
  EM_TRANSPORTE: { caminho: 'conclusao', rotulo: 'Concluir' },
}

export function PaginaDeEntregas() {
  const [filtro, setFiltro] = useState<StatusEntrega | ''>('')
  const [avancando, setAvancando] = useState<number | null>(null)

  const todas = useRecurso<Entrega[]>('/entregas')
  const requisicoes = useRecurso<Pagina<Requisicao>>('/requisicoes?status=ALOCADA&size=100')
  const veiculos = useRecurso<Veiculo[]>('/veiculos')
  const origens = useRecurso<Unidade[]>('/hemocentros')

  const entregas = todas.dados ?? []
  const filtradas = filtro ? entregas.filter((entrega) => entrega.status === filtro) : entregas
  const paginacao = usePaginacaoLocal([...filtradas].sort((a, b) => b.id - a.id), 8)
  const contar = (...status: StatusEntrega[]) => entregas.filter((entrega) => status.includes(entrega.status)).length

  function recarregarTudo() {
    todas.recarregar()
    requisicoes.recarregar()
    veiculos.recarregar()
  }

  async function avancar(entrega: Entrega) {
    const etapa = PROXIMA_ETAPA[entrega.status]
    if (!etapa) return
    setAvancando(entrega.id)
    try {
      await api.enviar(`/entregas/${entrega.id}/${etapa.caminho}`)
      toast.success(`Entrega da ${entrega.requisicaoCodigo} atualizada`, { description: `${etapa.rotulo}: concluído.` })
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
      celula: (entrega) => <span className="font-mono text-[13px]">{entrega.requisicaoCodigo}</span>,
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
      celula: (entrega) => <span className="font-mono text-[13px]">{entrega.veiculoPlaca}</span>,
      esqueleto: 'w-20',
    },
    {
      id: 'rota',
      cabecalho: 'Rota planejada',
      celula: (entrega) =>
        entrega.rota ? (
          <span className="line-clamp-1 max-w-56">{entrega.rota}</span>
        ) : (
          <span className="text-muted-foreground">Não informada</span>
        ),
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
      cabecalho: <span className="sr-only">Ação</span>,
      celula: (entrega) => {
        const etapa = PROXIMA_ETAPA[entrega.status]
        return etapa ? (
          <Button
            variant="outline"
            size="sm"
            carregando={avancando === entrega.id}
            disabled={avancando !== null && avancando !== entrega.id}
            onClick={() => avancar(entrega)}
          >
            {etapa.rotulo}
          </Button>
        ) : null
      },
      className: 'text-right',
      esqueleto: 'ml-auto w-24',
    },
  ]

  const carregandoFormulario = requisicoes.carregando || veiculos.carregando || origens.carregando
  const erroDoFormulario = requisicoes.erro ?? veiculos.erro ?? origens.erro

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Entregas"
        descricao="Planejamento e acompanhamento das entregas, da saída do hemocentro até o hospital."
        acoes={
          <Button variant="outline" size="sm" onClick={recarregarTudo}>
            <RotateCw />
            Atualizar
          </Button>
        }
      />

      <AvisoAcademico complemento="A rota é um texto planejado; o backend ainda não fornece geometria para desenhar um mapa." />

      <div className="grid gap-4 sm:grid-cols-3">
        <CartaoDeMetrica rotulo="Planejadas" icone={ClipboardCheck} carregando={todas.carregando} valor={contar('PLANEJADA')} contexto="Aguardando despacho" />
        <CartaoDeMetrica rotulo="Em rota" icone={Truck} carregando={todas.carregando} valor={contar('DESPACHADA', 'EM_TRANSPORTE')} contexto="Despachadas ou em transporte" />
        <CartaoDeMetrica rotulo="Entregues" icone={CheckCircle2} carregando={todas.carregando} valor={contar('ENTREGUE')} contexto="Concluídas com sucesso" />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Planejar entrega</CardTitle>
              <CardDescription>Para requisições com bolsas já alocadas.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {carregandoFormulario ? (
              <div className="space-y-5">
                {[0, 1, 2].map((indice) => (
                  <div key={indice} className="space-y-2">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                ))}
              </div>
            ) : erroDoFormulario ? (
              <Alerta tipo="erro" titulo="Não foi possível carregar os dados do formulário">
                {erroDoFormulario}
              </Alerta>
            ) : (
              <FormularioDeEntrega
                aptas={requisicoes.dados?.content ?? []}
                veiculos={veiculos.dados ?? []}
                origens={origens.dados ?? []}
                aoPlanejar={recarregarTudo}
              />
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div>
              <CardTitle>Acompanhamento</CardTitle>
              <CardDescription>Avance cada entrega pela próxima etapa.</CardDescription>
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
                descricao={filtro ? 'Escolha outra situação ou limpe o filtro.' : 'Planeje a primeira no formulário ao lado.'}
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
      </div>
    </div>
  )
}
