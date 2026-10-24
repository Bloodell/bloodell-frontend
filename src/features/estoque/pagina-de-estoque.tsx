'use client'

import { Plus, RotateCw, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { BarraDeFiltros, CampoDeBusca } from '@/components/data-table/barra-de-filtros'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Bolsa, EstadoBolsa, ItemDeEstoque, Pagina, TipoComponente, Unidade } from '@/lib/api/tipos'
import { COMPONENTES, rotulo } from '@/lib/formatos'
import { PainelDeRastreabilidade } from './painel-de-rastreabilidade'
import { TabelaDeBolsas } from './tabela-de-bolsas'
import { TabelaDePosicao } from './tabela-de-posicao'

const SITUACOES: EstadoBolsa[] = ['DISPONIVEL', 'RESERVADA', 'ALOCADA', 'EM_TRANSPORTE', 'ENTREGUE', 'VENCIDA', 'DESCARTADA']
const TAMANHO_DA_PAGINA = 10

/** US05 -- visualizar e controlar o estoque. Tudo vem da API, nada e mockado. */
export function PaginaDeEstoque() {
  const [unidadeId, setUnidadeId] = useState('')
  const [componente, setComponente] = useState<TipoComponente | ''>('')
  const [situacao, setSituacao] = useState<EstadoBolsa | ''>('DISPONIVEL')
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(0)
  const [bolsaAberta, setBolsaAberta] = useState<Bolsa | null>(null)

  const unidades = useRecurso<Unidade[]>('/hemocentros')

  // Hemocentro e componente valem para as duas tabelas.
  const filtrosComuns = new URLSearchParams()
  if (componente) filtrosComuns.set('componente', componente)
  if (unidadeId) filtrosComuns.set('unidadeId', unidadeId)
  const posicao = useRecurso<ItemDeEstoque[]>(`/estoques?${filtrosComuns}`)

  const filtrosDeBolsa = new URLSearchParams(filtrosComuns)
  filtrosDeBolsa.set('page', String(pagina))
  filtrosDeBolsa.set('size', String(TAMANHO_DA_PAGINA))
  if (situacao) filtrosDeBolsa.set('status', situacao)
  const bolsas = useRecurso<Pagina<Bolsa>>(`/bolsas?${filtrosDeBolsa}`)

  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const bolsasVisiveis = (bolsas.dados?.content ?? []).filter((bolsa) =>
    `${bolsa.codigo} ${bolsa.tipoSanguineo} ${bolsa.unidadeAtualNome} ${rotulo(bolsa.componente)}`
      .toLocaleLowerCase('pt-BR')
      .includes(termo),
  )

  function mudarUnidade(valor: string) {
    setUnidadeId(valor)
    setPagina(0)
  }

  function mudarComponente(valor: TipoComponente | '') {
    setComponente(valor)
    setPagina(0)
  }

  function mudarSituacao(valor: EstadoBolsa | '') {
    setSituacao(valor)
    setPagina(0)
  }

  function limparFiltrosDasBolsas() {
    setSituacao('DISPONIVEL')
    setBusca('')
    setPagina(0)
  }

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Estoque"
        descricao="Posição por unidade, tipo sanguíneo e componente, e cada bolsa na ordem de chegada."
        acoes={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                posicao.recarregar()
                bolsas.recarregar()
              }}
            >
              <RotateCw />
              Atualizar
            </Button>
            <Link href="/doacoes" className={buttonVariants({ size: 'sm' })}>
              <Plus />
              Registrar doação
            </Link>
          </>
        }
      />

      <AvisoAcademico />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground sm:mr-1">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filtrar estoque
        </span>
        <Select
          compacto
          aria-label="Filtrar por hemocentro"
          value={unidadeId}
          onChange={(evento) => mudarUnidade(evento.target.value)}
          className="sm:w-56"
        >
          <option value="">Todos os hemocentros</option>
          {(unidades.dados ?? []).map((unidade) => (
            <option key={unidade.id} value={unidade.id}>
              {unidade.nome}
            </option>
          ))}
        </Select>
        <Select
          compacto
          aria-label="Filtrar por componente"
          value={componente}
          onChange={(evento) => mudarComponente(evento.target.value as TipoComponente | '')}
          className="sm:w-56"
        >
          <option value="">Todos os componentes</option>
          {COMPONENTES.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </Select>
        {(unidadeId || componente) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              mudarUnidade('')
              mudarComponente('')
            }}
          >
            Limpar
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div>
            <CardTitle>Posição de estoque</CardTitle>
            <CardDescription>Bolsas contadas por unidade, tipo sanguíneo e componente.</CardDescription>
          </div>
        </CardHeader>
        <TabelaDePosicao recurso={posicao} />
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Bolsas</CardTitle>
            <CardDescription>
              Na ordem de chegada, a mesma da lista encadeada da AED. Clique numa bolsa para ver o histórico.
            </CardDescription>
          </div>
        </CardHeader>
        <BarraDeFiltros
          className="border-t"
          ativos={[situacao !== 'DISPONIVEL', busca.length > 0].filter(Boolean).length}
          aoLimpar={limparFiltrosDasBolsas}
        >
          <CampoDeBusca
            valor={busca}
            aoMudar={setBusca}
            placeholder="Código, tipo ou unidade"
            rotulo="Buscar bolsas nesta página"
          />
          <Select
            compacto
            aria-label="Filtrar por situação"
            value={situacao}
            onChange={(evento) => mudarSituacao(evento.target.value as EstadoBolsa | '')}
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
        <TabelaDeBolsas
          recurso={bolsas}
          linhas={bolsasVisiveis}
          pagina={pagina}
          aoMudarPagina={setPagina}
          aoAbrir={setBolsaAberta}
          temBusca={termo.length > 0}
        />
      </Card>

      <PainelDeRastreabilidade bolsa={bolsaAberta} aoFechar={() => setBolsaAberta(null)} />
    </div>
  )
}
