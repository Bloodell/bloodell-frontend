'use client'

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ContagemPorCategoria } from '@/lib/api/tipos'
import { TIPOS_SANGUINEOS } from '@/lib/formatos'

function Dica({ active, payload }: { active?: boolean; payload?: { payload: ContagemPorCategoria }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-mono font-semibold">{item.categoria}</p>
      <p className="mt-0.5 text-muted-foreground tabular-nums">{item.quantidade} bolsa(s) disponível(is)</p>
    </div>
  )
}

/**
 * Bolsas disponiveis por tipo ABO/Rh. Os 8 tipos sempre aparecem (zero e
 * informacao): positivos em verde, negativos (mais raros) em vermelho.
 */
export function GraficoPorTipo({ dados }: { dados: ContagemPorCategoria[] }) {
  const porTipo = new Map(dados.map((item) => [item.categoria, item.quantidade]))
  const serie = TIPOS_SANGUINEOS.map((tipo) => ({ categoria: tipo, quantidade: porTipo.get(tipo) ?? 0 }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={serie} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} className="stroke-border" strokeDasharray="3 3" />
        <XAxis
          dataKey="categoria"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ className: 'fill-muted-foreground font-mono text-[11px]' }}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ className: 'fill-muted-foreground text-[11px]' }} />
        <Tooltip content={<Dica />} cursor={{ className: 'fill-muted/60' }} />
        <Bar dataKey="quantidade" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {serie.map((item) => (
            <Cell key={item.categoria} className={item.categoria.endsWith('-') ? 'fill-brand' : 'fill-success'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
