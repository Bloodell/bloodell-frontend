/* eslint-disable @next/next/no-img-element -- export estatico: sem otimizador de imagem do Next */
import type { CSSProperties } from 'react'

/**
 * Painel lateral do login. Com foto, mostra a foto sob um veu da cor da
 * lateral; sem foto, desenha a rede em isometria: hemocentros (predios com a
 * gota da marca) e hospitais (predios com a cruz). A rede se forma na
 * entrada -- predios sobem, rotas se tracam ligando uma unidade a outra -- e
 * depois as entregas circulam. Com prefers-reduced-motion, a rede aparece
 * pronta e parada (todas as animacoes estao atras de `motion-safe:`).
 */

// --- Projecao isometrica ------------------------------------------------------
// Chao no plano (x, y), altura em z, tudo em "quadras". 30 graus classicos.
const QUADRA = 21
const COS30 = Math.cos(Math.PI / 6)

type Ponto = [number, number]

function iso(x: number, y: number, z = 0): Ponto {
  return [(x - y) * COS30 * QUADRA, (x + y) * 0.5 * QUADRA - z * QUADRA]
}

const pontos = (lista: Ponto[]) => lista.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ')

// --- A rede -------------------------------------------------------------------
type Tipo = 'hemocentro' | 'hospital'

interface Predio {
  id: string
  tipo: Tipo
  x: number
  y: number
  /** Largura (eixo x), profundidade (eixo y) e altura, em quadras. */
  l: number
  p: number
  a: number
}

const PREDIOS: Predio[] = [
  { id: 'h1', tipo: 'hemocentro', x: 2, y: 2, l: 3, p: 3, a: 3.1 },
  { id: 'h2', tipo: 'hemocentro', x: 11, y: 1, l: 2.6, p: 2.6, a: 2.5 },
  { id: 'h3', tipo: 'hemocentro', x: 8, y: 10, l: 2.6, p: 2.6, a: 2.3 },
  { id: 'p1', tipo: 'hospital', x: 0, y: 10, l: 2.2, p: 2.2, a: 1.5 },
  { id: 'p2', tipo: 'hospital', x: 14, y: 7, l: 2.2, p: 2.2, a: 1.8 },
  { id: 'p3', tipo: 'hospital', x: 3, y: 16, l: 2.2, p: 2.2, a: 1.4 },
  { id: 'p4', tipo: 'hospital', x: 15, y: 14, l: 2.2, p: 2.2, a: 1.6 },
]

/** Rotas na ordem em que se tracam. `entrega`: tem bolsa circulando depois. */
const ROTAS: { de: string; para: string; entrega: boolean }[] = [
  { de: 'h1', para: 'p1', entrega: true },
  { de: 'h1', para: 'h2', entrega: false },
  { de: 'h2', para: 'p2', entrega: true },
  { de: 'h1', para: 'h3', entrega: false },
  { de: 'h3', para: 'p3', entrega: true },
  { de: 'h3', para: 'p4', entrega: true },
]

const porId = new Map(PREDIOS.map((predio) => [predio.id, predio]))

/** Centro da base no chao: as ruas saem de baixo do predio. */
function base(predio: Predio): [number, number] {
  return [predio.x + predio.l / 2, predio.y + predio.p / 2]
}

/** Rua em L seguindo a grade: anda em x, depois em y. */
function caminhoDaRota(de: Predio, para: Predio): string {
  const [ax, ay] = base(de)
  const [bx, by] = base(para)
  const [p0, p1, p2] = [iso(ax, ay), iso(bx, ay), iso(bx, by)]
  return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} L${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
}

// --- Tempo da entrada (ms) -------------------------------------------------------
const INICIO_DOS_PREDIOS = 150
const INTERVALO_DOS_PREDIOS = 60
const INICIO_DAS_ROTAS = 850
const INTERVALO_DAS_ROTAS = 380
const DURACAO_DA_ROTA = 700

const atraso = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

// --- Desenho --------------------------------------------------------------------
const CORES: Record<Tipo, { topo: string; esquerda: string; direita: string; janela: string }> = {
  hemocentro: {
    topo: 'color-mix(in oklab, var(--sidebar-indicator) 62%, white)',
    esquerda: 'var(--sidebar-indicator)',
    direita: 'color-mix(in oklab, var(--sidebar-indicator) 62%, var(--sidebar))',
    janela: 'color-mix(in oklab, var(--sidebar) 55%, transparent)',
  },
  hospital: {
    topo: 'var(--sidebar-foreground)',
    esquerda: 'color-mix(in oklab, var(--sidebar-foreground) 78%, var(--sidebar))',
    direita: 'color-mix(in oklab, var(--sidebar-foreground) 55%, var(--sidebar))',
    janela: 'color-mix(in oklab, var(--sidebar-indicator) 45%, transparent)',
  },
}

/** Faixas de janelas numa face; `lado` diz qual parede (frente-esquerda ou frente-direita). */
function Janelas({ predio, lado, cor }: { predio: Predio; lado: 'esquerda' | 'direita'; cor: string }) {
  const { x, y, l, p, a } = predio
  const andares: number[] = []
  for (let z = 0.45; z + 0.32 < a - 0.2; z += 0.72) andares.push(z)
  return (
    <>
      {andares.map((z) => {
        const faixa: Ponto[] =
          lado === 'esquerda'
            ? [iso(x + 0.3, y + p, z), iso(x + l - 0.3, y + p, z), iso(x + l - 0.3, y + p, z + 0.32), iso(x + 0.3, y + p, z + 0.32)]
            : [iso(x + l, y + p - 0.3, z), iso(x + l, y + 0.3, z), iso(x + l, y + 0.3, z + 0.32), iso(x + l, y + p - 0.3, z + 0.32)]
        return <polygon key={`${lado}-${z}`} points={pontos(faixa)} fill={cor} />
      })}
    </>
  )
}

function Emblema({ tipo }: { tipo: Tipo }) {
  if (tipo === 'hemocentro') {
    // A gota da marca, em pe sobre o telhado.
    return (
      <path
        d="M0 -13 C-2.2 -8.6 -7.6 -3.4 -7.6 1.4 A7.6 7.6 0 0 0 7.6 1.4 C7.6 -3.4 2.2 -8.6 0 -13Z"
        fill="#f4f1ff"
        stroke="var(--sidebar)"
        strokeWidth="1.5"
      />
    )
  }
  return (
    <g>
      <rect x="-7" y="-7" width="14" height="14" rx="3.5" fill="var(--sidebar-foreground)" stroke="var(--sidebar)" strokeWidth="1.5" />
      <path d="M0 -3.6v7.2M-3.6 0h7.2" stroke="var(--sidebar)" strokeWidth="2" strokeLinecap="round" />
    </g>
  )
}

function PredioIsometrico({ predio, ordem }: { predio: Predio; ordem: number }) {
  const { x, y, l, p, a, tipo } = predio
  const cor = CORES[tipo]
  const topo: Ponto[] = [iso(x, y, a), iso(x + l, y, a), iso(x + l, y + p, a), iso(x, y + p, a)]
  const esquerda: Ponto[] = [iso(x, y + p, 0), iso(x + l, y + p, 0), iso(x + l, y + p, a), iso(x, y + p, a)]
  const direita: Ponto[] = [iso(x + l, y, 0), iso(x + l, y + p, 0), iso(x + l, y + p, a), iso(x + l, y, a)]
  const sombra: Ponto[] = [iso(x + l, y, 0), iso(x + l + 0.9, y + 0.5, 0), iso(x + l + 0.9, y + p + 0.5, 0), iso(x + l, y + p, 0)]
  const [cx, cy] = iso(x + l / 2, y + p / 2, a)

  return (
    <g className="motion-safe:animate-erguer" style={atraso(INICIO_DOS_PREDIOS + ordem * INTERVALO_DOS_PREDIOS)}>
      <polygon points={pontos(sombra)} fill="var(--sidebar)" opacity="0.55" />
      <polygon points={pontos(esquerda)} fill={cor.esquerda} />
      <polygon points={pontos(direita)} fill={cor.direita} />
      <Janelas predio={predio} lado="esquerda" cor={cor.janela} />
      <Janelas predio={predio} lado="direita" cor={cor.janela} />
      <polygon points={pontos(topo)} fill={cor.topo} />
      {/* Mastro + emblema, flutuando de leve sobre o telhado. */}
      <g transform={`translate(${cx.toFixed(1)} ${(cy - 6).toFixed(1)})`}>
        <line x1="0" y1="6" x2="0" y2="-6" stroke="var(--sidebar)" strokeWidth="1.5" opacity="0.6" />
        <g className="motion-safe:animate-flutuar" style={atraso(ordem * 240)}>
          <g transform="translate(0 -16)">
            <Emblema tipo={tipo} />
          </g>
        </g>
      </g>
    </g>
  )
}

function RedeIsometrica() {
  // Enquadramento calculado a partir de tudo que e desenhado.
  const todos: Ponto[] = PREDIOS.flatMap(({ x, y, l, p, a }) => [
    iso(x, y, a + 1.6),
    iso(x + l + 0.9, y + p + 0.5),
    iso(x, y + p),
    iso(x + l + 0.9, y),
  ])
  const xs = todos.map(([a]) => a)
  const ys = todos.map(([, b]) => b)
  const margem = 28
  const minX = Math.min(...xs) - margem
  const minY = Math.min(...ys) - margem
  const largura = Math.max(...xs) - minX + margem
  const altura = Math.max(...ys) - minY + margem

  // Grade do chao: ruas finas a cada quadra.
  const linhasDaGrade: string[] = []
  for (let k = -1; k <= 19; k++) {
    const [a1, a2] = [iso(k, -1), iso(k, 19)]
    const [b1, b2] = [iso(-1, k), iso(19, k)]
    linhasDaGrade.push(`M${a1[0]} ${a1[1]}L${a2[0]} ${a2[1]}`, `M${b1[0]} ${b1[1]}L${b2[0]} ${b2[1]}`)
  }

  const rotas = ROTAS.map((rota, indice) => {
    const de = porId.get(rota.de) as Predio
    const para = porId.get(rota.para) as Predio
    const inicio = INICIO_DAS_ROTAS + indice * INTERVALO_DAS_ROTAS
    return { ...rota, indice, caminho: caminhoDaRota(de, para), chegada: iso(...base(para)), fim: inicio + DURACAO_DA_ROTA, inicio }
  })

  // Pintor: o que esta mais ao fundo (x + y menor) e desenhado primeiro.
  const ordenados = [...PREDIOS].sort((a, b) => a.x + a.l + a.y + a.p - (b.x + b.l + b.y + b.p))

  return (
    <svg viewBox={`${minX} ${minY} ${largura} ${altura}`} className="h-auto w-full max-w-[600px]" aria-hidden="true">
      <path
        d={linhasDaGrade.join('')}
        stroke="var(--sidebar-muted)"
        strokeOpacity="0.1"
        strokeWidth="1"
        fill="none"
        className="motion-safe:animate-[fade-in_900ms_cubic-bezier(0.23,1,0.32,1)_both]"
      />

      {/* Ruas: o leito apagado ja existe; a ligacao acesa se traca por cima, em sequencia. */}
      {rotas.map((rota) => (
        <g key={`${rota.de}-${rota.para}`}>
          <path d={rota.caminho} fill="none" stroke="var(--sidebar-muted)" strokeOpacity="0.28" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
          <path
            d={rota.caminho}
            pathLength={1}
            fill="none"
            stroke="var(--sidebar-indicator)"
            strokeWidth="2.25"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray="1 1"
            className="motion-safe:animate-tracar"
            style={atraso(rota.inicio)}
          />
          {/* Pulso de chegada: a unidade de destino "acende" quando a rota a alcanca. */}
          <ellipse
            cx={rota.chegada[0]}
            cy={rota.chegada[1]}
            rx="26"
            ry="15"
            fill="none"
            stroke="var(--sidebar-indicator)"
            strokeWidth="1.5"
            opacity="0"
            className="origin-center [transform-box:fill-box] motion-safe:animate-chegada"
            style={atraso(rota.fim - 120)}
          />
        </g>
      ))}

      {/* Entregas: depois que a rota existe, uma bolsa passa a circular nela. */}
      {rotas
        .filter((rota) => rota.entrega)
        .map((rota, indice) => (
          <circle
            key={`entrega-${rota.de}-${rota.para}`}
            r="4.5"
            fill="#f4f1ff"
            stroke="var(--sidebar-indicator)"
            strokeWidth="2.5"
            className="motion-safe:animate-[percurso_4200ms_linear_infinite_both]"
            style={{
              offsetPath: `path('${rota.caminho}')`,
              offsetDistance: '55%',
              offsetRotate: '0deg',
              animationDelay: `${rota.fim + 250 + indice * 900}ms`,
            }}
          />
        ))}

      {ordenados.map((predio) => (
        <PredioIsometrico key={predio.id} predio={predio} ordem={PREDIOS.indexOf(predio)} />
      ))}
    </svg>
  )
}

/** Cubo isometrico pequeno para a legenda. */
function IconeDePredio({ tipo }: { tipo: Tipo }) {
  const cor = CORES[tipo]
  return (
    <svg viewBox="-9 -10 18 19" className="size-4" aria-hidden="true">
      <polygon points="0,-9 8,-4.5 0,0 -8,-4.5" fill={cor.topo} />
      <polygon points="-8,-4.5 0,0 0,9 -8,4.5" fill={cor.esquerda} />
      <polygon points="0,0 8,-4.5 8,4.5 0,9" fill={cor.direita} />
    </svg>
  )
}

export function PainelDaRede({ imagem }: { imagem: { caminho: string; descricao: string } | null }) {
  return (
    <aside className="relative hidden overflow-hidden border-l border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      {imagem ? (
        <>
          <img src={imagem.caminho} alt={imagem.descricao} className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-sidebar via-sidebar/70 to-sidebar/10" aria-hidden="true" />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-10 pt-12">
          <RedeIsometrica />
        </div>
      )}

      <div className={imagem ? 'relative mt-auto px-14 pb-14' : 'px-14 pb-14'}>
        <p className="max-w-md text-[1.75rem] leading-tight font-semibold tracking-tight text-white text-balance">
          Do doador ao leito, numa rede só.
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-sidebar-muted text-pretty">
          Doações viram bolsas, bolsas viram estoque, hospitais pedem por prioridade e cada entrega é acompanhada com
          a temperatura da cadeia fria.
        </p>
        {!imagem && (
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-apoio text-sidebar-muted">
            <li className="flex items-center gap-2">
              <IconeDePredio tipo="hemocentro" />
              Hemocentro
            </li>
            <li className="flex items-center gap-2">
              <IconeDePredio tipo="hospital" />
              Hospital
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2.5 rounded-full border-2 border-sidebar-indicator bg-[#f4f1ff]" aria-hidden="true" />
              Entrega em rota
            </li>
          </ul>
        )}
      </div>
    </aside>
  )
}
