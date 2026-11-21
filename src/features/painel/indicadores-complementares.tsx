'use client'

import { ChevronDown, Sigma } from 'lucide-react'
import type { ContagemPorCategoria, EstatisticaDescritiva, IndicadorDeDemanda, IndicadorDeEstoque } from '@/lib/api/tipos'
import { numero, rotulo } from '@/lib/formatos'

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** Numero finito formatado; o que nao for (NaN, Infinity) aparece como "—". */
export function formatarEstatistica(valor: number): string {
  return Number.isFinite(valor) ? decimal.format(valor) : '—'
}

function Contagens({ titulo, itens, traduzir }: { titulo: string; itens: ContagemPorCategoria[]; traduzir?: boolean }) {
  const maximo = Math.max(1, ...itens.map((item) => item.quantidade))
  return (
    <div>
      <h3 className="mb-2 text-rotulo font-medium">{titulo}</h3>
      {itens.length === 0 ? (
        <p className="text-apoio text-muted-foreground">Sem registros.</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((item) => (
            <li key={item.categoria} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
              <span className="truncate text-apoio">{traduzir ? rotulo(item.categoria) : item.categoria}</span>
              <span className="text-apoio font-medium tabular-nums">{numero(item.quantidade)}</span>
              <span className="col-span-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-foreground/60" style={{ width: `${(item.quantidade / maximo) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Estatisticas({ titulo, dados, unidade }: { titulo: string; dados: EstatisticaDescritiva; unidade: string }) {
  const linhas: [string, number][] = [
    ['Média', dados.media],
    ['Mediana', dados.mediana],
    ['Mínimo', dados.minimo],
    ['Máximo', dados.maximo],
    ['Desvio-padrão amostral', dados.desvioPadraoAmostral],
    ['Coeficiente de variação', dados.coeficienteDeVariacao],
  ]
  return (
    <div>
      <h3 className="mb-2 text-rotulo font-medium">{titulo}</h3>
      {dados.quantidade < 2 ? (
        <p className="text-apoio text-muted-foreground">
          {dados.quantidade === 0 ? 'Sem amostras.' : 'Uma amostra só: dispersão não se aplica.'}
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-apoio">
          {linhas.map(([nome, valor]) => (
            <div key={nome} className="contents">
              <dt className="text-muted-foreground">{nome}</dt>
              <dd className="text-right font-medium tabular-nums">{formatarEstatistica(valor)}</dd>
            </div>
          ))}
          <div className="contents">
            <dt className="text-muted-foreground">Amostras</dt>
            <dd className="text-right font-medium tabular-nums">
              {numero(dados.quantidade)} {unidade}
            </dd>
          </div>
        </dl>
      )}
    </div>
  )
}

/**
 * O resto do que os indicadores da API devolvem (componente, hospital e a
 * estatistica descritiva), recolhido para nao competir com a decisao do dia.
 * So mostra o que veio da API; nenhum KPI e derivado aqui.
 */
export function IndicadoresComplementares({
  estoque,
  demanda,
}: {
  estoque: IndicadorDeEstoque | null
  demanda: IndicadorDeDemanda | null
}) {
  if (!estoque && !demanda) return null
  return (
    <details className="group rounded-xl border bg-card shadow-xs">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <Sigma className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-subtitulo font-semibold tracking-tight">Indicadores detalhados</span>
          <span className="block text-apoio text-muted-foreground">Estoque por componente, demanda por hospital e estatística descritiva.</span>
        </span>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid gap-8 border-t px-6 py-5 md:grid-cols-2">
        {estoque && (
          <>
            <Contagens titulo="Bolsas disponíveis por componente" itens={estoque.porComponente} traduzir />
            <Estatisticas titulo="Distribuição entre tipos sanguíneos" dados={estoque.distribuicaoPorTipo} unidade="tipos" />
          </>
        )}
        {demanda && (
          <>
            <Contagens titulo="Requisições por hospital" itens={demanda.porHospital} />
            <Estatisticas titulo="Distribuição entre hospitais" dados={demanda.distribuicaoPorHospital} unidade="hospitais" />
          </>
        )}
        {(estoque?.aviso || demanda?.aviso) && (
          <p className="text-apoio text-muted-foreground md:col-span-2">{estoque?.aviso ?? demanda?.aviso}</p>
        )}
      </div>
    </details>
  )
}
