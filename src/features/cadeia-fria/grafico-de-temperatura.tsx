'use client'

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { LeituraDeTelemetria } from '@/lib/api/tipos'

interface Ponto {
  horario: string
  temperatura: number
  dentroDaFaixa: boolean
}

function Dica({ active, payload }: { active?: boolean; payload?: { payload: Ponto }[] }) {
  if (!active || !payload?.length) return null
  const ponto = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="text-muted-foreground">{ponto.horario}</p>
      <p className="mt-0.5 font-medium tabular-nums">{ponto.temperatura.toFixed(1)} °C</p>
      {!ponto.dentroDaFaixa && <p className="mt-0.5 font-medium text-destructive">Fora da faixa didática</p>}
    </div>
  )
}

/** Ultimas 30 leituras de temperatura de um veiculo. */
export function GraficoDeTemperatura({ leituras }: { leituras: LeituraDeTelemetria[] }) {
  const pontos: Ponto[] = leituras.slice(-30).map((leitura) => ({
    horario: new Date(leitura.registradaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    temperatura: Number(leitura.temperaturaC),
    dentroDaFaixa: leitura.dentroDaFaixaDidatica,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={pontos} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="preenchimento-temperatura" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} className="stroke-border" strokeDasharray="3 3" />
        <XAxis
          dataKey="horario"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tick={{ className: 'fill-muted-foreground text-[11px]' }}
        />
        <YAxis
          unit="°"
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ className: 'fill-muted-foreground text-[11px]' }}
        />
        <Tooltip content={<Dica />} cursor={{ className: 'stroke-border' }} />
        <Area
          dataKey="temperatura"
          type="monotone"
          className="text-primary"
          stroke="currentColor"
          strokeWidth={1.75}
          fill="url(#preenchimento-temperatura)"
          dot={false}
          activeDot={{ r: 3.5, className: 'fill-primary stroke-background' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
