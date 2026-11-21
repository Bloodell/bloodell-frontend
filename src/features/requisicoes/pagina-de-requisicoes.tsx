'use client'

import { ClipboardPlus, RotateCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { BarraDeFiltros } from '@/components/data-table/barra-de-filtros'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/api/cliente'
import { useRecurso } from '@/lib/api/use-recurso'
import type {
  ItemDaFila,
  Pagina,
  Prioridade,
  Requisicao,
  ResultadoDaAlocacao,
  StatusRequisicao,
  Unidade,
} from '@/lib/api/tipos'
import { numero, PRIORIDADES, rotulo, tomDoStatusDaRequisicao } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { FilaDeAtendimento } from './fila-de-atendimento'
import { FormularioDeRequisicao } from './formulario-de-requisicao'
import { PainelDeAlocacao } from './painel-de-alocacao'
import { PainelDeRequisicao } from './painel-de-requisicao'
import { processarAlocacao } from './requisicoes-api'
import { TabelaDeRequisicoes } from './tabela-de-requisicoes'

const SITUACOES: StatusRequisicao[] = ['NA_FILA', 'ALOCADA', 'EM_ROTA', 'ATENDIDA', 'CANCELADA', 'REJEITADA']
const RESUMO: { status: StatusRequisicao; contexto: string }[] = [
  { status: 'NA_FILA', contexto: 'aguardando alocação' },
  { status: 'ALOCADA', contexto: 'prontas para entrega' },
  { status: 'EM_ROTA', contexto: 'a caminho do hospital' },
  { status: 'ATENDIDA', contexto: 'entregues' },
]
const TAMANHO_DA_PAGINA = 10

const COR_DO_TOM: Record<string, string> = {
  atencao: 'bg-atencao',
  info: 'bg-secondary-foreground',
  frio: 'bg-frio',
  sucesso: 'bg-estavel',
}

/** Conta de uma situacao: so le totalElements de uma pagina de 1 item. */
function CartaoDeSituacao({
  status,
  contexto,
  ativo,
  versao,
  aoEscolher,
}: {
  status: StatusRequisicao
  contexto: string
  ativo: boolean
  versao: number
  aoEscolher: () => void
}) {
  const contagem = useRecurso<Pagina<Requisicao>>(`/requisicoes?status=${status}&size=1`)
  const { recarregar } = contagem
  const versaoVista = useRef(versao)
  useEffect(() => {
    if (versaoVista.current === versao) return
    versaoVista.current = versao
    recarregar()
  }, [versao, recarregar])
  return (
    <button
      type="button"
      onClick={aoEscolher}
      aria-pressed={ativo}
      className={cn(
        'flex flex-col items-start rounded-xl border bg-card p-4 text-left shadow-xs transition-[border-color,box-shadow] outline-none hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring',
        ativo && 'border-foreground/70 shadow-sm',
      )}
    >
      <span className="flex items-center gap-2 text-rotulo font-medium text-muted-foreground">
        <span className={cn('size-2 rounded-full', COR_DO_TOM[tomDoStatusDaRequisicao(status)] ?? 'bg-muted-foreground')} aria-hidden="true" />
        {rotulo(status)}
      </span>
      {contagem.erro ? (
        <span className="mt-2 text-metrica leading-none font-semibold">—</span>
      ) : contagem.dados ? (
        <span className="mt-2 text-metrica leading-none font-semibold tracking-tight tabular-nums">
          {numero(contagem.dados.totalElements)}
        </span>
      ) : (
        <Skeleton className="mt-2 h-8 w-12" />
      )}
      <span className="mt-1.5 text-apoio text-muted-foreground">{ativo ? 'filtro aplicado · clique para limpar' : contexto}</span>
    </button>
  )
}

/** US06 -- criar e acompanhar requisicoes, ver a fila e processar a alocacao. */
export function PaginaDeRequisicoes() {
  const [status, setStatus] = useState<StatusRequisicao | ''>('')
  const [prioridade, setPrioridade] = useState<Prioridade | ''>('')
  const [hospitalId, setHospitalId] = useState('')
  const [pagina, setPagina] = useState(0)
  const [criando, setCriando] = useState(false)
  const [selecionada, setSelecionada] = useState<number | null>(null)
  const [processando, setProcessando] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoDaAlocacao | null>(null)
  const [versao, setVersao] = useState(0)

  const hospitais = useRecurso<Unidade[]>('/hospitais')
  const fila = useRecurso<ItemDaFila[]>('/requisicoes/fila')

  const filtros = new URLSearchParams({ page: String(pagina), size: String(TAMANHO_DA_PAGINA) })
  if (status) filtros.set('status', status)
  if (prioridade) filtros.set('prioridade', prioridade)
  if (hospitalId) filtros.set('hospitalId', hospitalId)
  const requisicoes = useRecurso<Pagina<Requisicao>>(`/requisicoes?${filtros}`)

  const filtrosAtivos = [status, prioridade, hospitalId].filter(Boolean).length

  function recarregarTudo() {
    fila.recarregar()
    requisicoes.recarregar()
    setVersao((valor) => valor + 1)
  }

  function filtrar(aplicar: () => void) {
    aplicar()
    setPagina(0)
  }

  async function processar(requisicao: Requisicao) {
    setProcessando(requisicao.id)
    try {
      const resposta = await processarAlocacao(requisicao.id)
      mostrarResultado(resposta)
    } catch (falha) {
      toast.error(`Não foi possível processar ${requisicao.codigo}`, {
        description: mensagemDeErro(falha, 'Erro inesperado ao processar a requisição.'),
      })
    } finally {
      setProcessando(null)
      recarregarTudo()
    }
  }

  function mostrarResultado(resposta: ResultadoDaAlocacao) {
    setSelecionada(null)
    setResultado(resposta)
    const parcial = resposta.quantidadeAlocada < resposta.quantidadeSolicitada
    toast[parcial ? 'warning' : 'success'](`Requisição ${resposta.requisicaoCodigo} processada`, {
      description: `${resposta.quantidadeAlocada} de ${resposta.quantidadeSolicitada} bolsa(s) alocada(s)${parcial ? ': atendimento parcial' : ''}.`,
    })
  }

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Requisições"
        descricao="Pedidos hospitalares de hemocomponentes, a fila de atendimento por prioridade e a alocação de bolsas."
        acoes={
          <>
            <Button variant="outline" size="sm" onClick={recarregarTudo}>
              <RotateCw />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setCriando(true)}>
              <ClipboardPlus />
              Nova requisição
            </Button>
          </>
        }
      />

      <AvisoAcademico />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {RESUMO.map((item) => (
          <CartaoDeSituacao
            key={item.status}
            status={item.status}
            contexto={item.contexto}
            versao={versao}
            ativo={status === item.status}
            aoEscolher={() => filtrar(() => setStatus((atual) => (atual === item.status ? '' : item.status)))}
          />
        ))}
      </div>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div>
              <CardTitle>Todas as requisições</CardTitle>
              <CardDescription>Abra uma requisição para ver o atendimento por item, mudar a prioridade ou cancelar.</CardDescription>
            </div>
          </CardHeader>
          <BarraDeFiltros
            className="border-t"
            ativos={filtrosAtivos}
            aoLimpar={() =>
              filtrar(() => {
                setStatus('')
                setPrioridade('')
                setHospitalId('')
              })
            }
          >
            <Select
              compacto
              aria-label="Filtrar por situação"
              value={status}
              onChange={(evento) => filtrar(() => setStatus(evento.target.value as StatusRequisicao | ''))}
              className="sm:w-44"
            >
              <option value="">Todas as situações</option>
              {SITUACOES.map((valor) => (
                <option key={valor} value={valor}>
                  {rotulo(valor)}
                </option>
              ))}
            </Select>
            <Select
              compacto
              aria-label="Filtrar por prioridade"
              value={prioridade}
              onChange={(evento) => filtrar(() => setPrioridade(evento.target.value as Prioridade | ''))}
              className="sm:w-44"
            >
              <option value="">Todas as prioridades</option>
              {PRIORIDADES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </Select>
            <Select
              compacto
              aria-label="Filtrar por hospital"
              value={hospitalId}
              onChange={(evento) => filtrar(() => setHospitalId(evento.target.value))}
              className="sm:w-56"
            >
              <option value="">Todos os hospitais</option>
              {(hospitais.dados ?? []).map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </option>
              ))}
            </Select>
          </BarraDeFiltros>
          <TabelaDeRequisicoes
            recurso={requisicoes}
            pagina={pagina}
            aoMudarPagina={setPagina}
            processando={processando}
            aoProcessar={processar}
            aoAbrir={(requisicao) => setSelecionada(requisicao.id)}
            filtrada={filtrosAtivos > 0}
            aoCriar={() => setCriando(true)}
          />
        </Card>

        <Card className="overflow-hidden 2xl:sticky 2xl:top-20">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Fila de atendimento</CardTitle>
              <CardDescription>Emergência, depois urgente, depois eletiva; empate pela ordem de chegada.</CardDescription>
            </div>
            {fila.dados && fila.dados.length > 0 && (
              <span className="rounded-md bg-muted px-2 py-1 text-apoio font-medium tabular-nums">{fila.dados.length} aguardando</span>
            )}
          </CardHeader>
          <FilaDeAtendimento fila={fila} />
        </Card>
      </div>

      <Sheet
        aberto={criando}
        aoMudar={setCriando}
        titulo="Nova requisição"
        descricao="Um pedido pode ter vários hemocomponentes e tipos sanguíneos."
        className="max-w-xl"
      >
        <FormularioDeRequisicao
          hospitais={hospitais}
          aoCriar={(requisicao) => {
            setCriando(false)
            setPagina(0)
            recarregarTudo()
            setSelecionada(requisicao.id)
          }}
        />
      </Sheet>

      <PainelDeRequisicao
        requisicaoId={selecionada}
        aoFechar={() => setSelecionada(null)}
        aoMudar={recarregarTudo}
        aoProcessar={mostrarResultado}
      />

      <PainelDeAlocacao resultado={resultado} aoFechar={() => setResultado(null)} />
    </div>
  )
}
