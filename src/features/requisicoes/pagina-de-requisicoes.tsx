'use client'

import { RotateCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { BarraDeFiltros } from '@/components/data-table/barra-de-filtros'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { api, mensagemDeErro } from '@/lib/api/cliente'
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
import { PRIORIDADES, rotulo } from '@/lib/formatos'
import { FilaDeAtendimento } from './fila-de-atendimento'
import { FormularioDeRequisicao } from './formulario-de-requisicao'
import { PainelDeAlocacao } from './painel-de-alocacao'
import { TabelaDeRequisicoes } from './tabela-de-requisicoes'

const SITUACOES: StatusRequisicao[] = ['NA_FILA', 'ALOCADA', 'EM_ROTA', 'ATENDIDA', 'CANCELADA', 'REJEITADA']
const TAMANHO_DA_PAGINA = 10

/** US06 -- criar e acompanhar requisicoes, ver a fila e processar a alocacao. */
export function PaginaDeRequisicoes() {
  const [status, setStatus] = useState<StatusRequisicao | ''>('')
  const [prioridade, setPrioridade] = useState<Prioridade | ''>('')
  const [hospitalId, setHospitalId] = useState('')
  const [pagina, setPagina] = useState(0)
  const [processando, setProcessando] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoDaAlocacao | null>(null)

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
  }

  function filtrar(aplicar: () => void) {
    aplicar()
    setPagina(0)
  }

  async function processar(requisicao: Requisicao) {
    setProcessando(requisicao.id)
    try {
      const resposta = await api.enviar<ResultadoDaAlocacao>(`/requisicoes/${requisicao.id}/alocacoes`)
      setResultado(resposta)
      toast.success(`Requisição ${resposta.requisicaoCodigo} processada`, {
        description: `${resposta.quantidadeAlocada} de ${resposta.quantidadeSolicitada} bolsa(s) alocada(s).`,
      })
    } catch (falha) {
      toast.error(`Não foi possível processar ${requisicao.codigo}`, {
        description: mensagemDeErro(falha, 'Erro inesperado ao processar a requisição.'),
      })
    } finally {
      setProcessando(null)
      recarregarTudo()
    }
  }

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Requisições"
        descricao="Pedidos hospitalares de hemocomponentes, a fila de atendimento por prioridade e a alocação de bolsas."
        acoes={
          <Button variant="outline" size="sm" onClick={recarregarTudo}>
            <RotateCw />
            Atualizar
          </Button>
        }
      />

      <AvisoAcademico />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Nova requisição</CardTitle>
              <CardDescription>Hemocomponente, tipo, quantidade e prioridade.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FormularioDeRequisicao
              hospitais={hospitais}
              aoCriar={() => {
                setPagina(0)
                recarregarTudo()
              }}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden lg:sticky lg:top-20">
          <CardHeader className="border-b pb-4">
            <div>
              <CardTitle>Fila de atendimento</CardTitle>
              <CardDescription>Emergência, depois urgente, depois eletiva; empate pela ordem de chegada.</CardDescription>
            </div>
            {fila.dados && fila.dados.length > 0 && (
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums">
                {fila.dados.length} aguardando
              </span>
            )}
          </CardHeader>
          <FilaDeAtendimento fila={fila} />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Todas as requisições</CardTitle>
            <CardDescription>Processe uma requisição da fila para reservar as bolsas e ver a decisão.</CardDescription>
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
          filtrada={filtrosAtivos > 0}
        />
      </Card>

      <PainelDeAlocacao resultado={resultado} aoFechar={() => setResultado(null)} />
    </div>
  )
}
