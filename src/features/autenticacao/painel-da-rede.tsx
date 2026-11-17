/* eslint-disable @next/next/no-img-element -- export estatico: sem otimizador de imagem do Next */

/**
 * Painel lateral do login. Com foto, mostra a foto sob um veu da cor da
 * lateral; sem foto, desenha a rede: hemocentros (etiqueta de bolsa, como na
 * marca), hospitais (circulo) e as rotas entre eles, com uma unica entrega em
 * movimento (desligada com prefers-reduced-motion).
 */

const HEMOCENTROS = [
  { x: 150, y: 170 },
  { x: 420, y: 120 },
  { x: 300, y: 380 },
]

const HOSPITAIS = [
  { x: 70, y: 330 },
  { x: 250, y: 230 },
  { x: 520, y: 260 },
  { x: 470, y: 470 },
  { x: 150, y: 500 },
  { x: 560, y: 60 },
]

const ROTAS = [
  'M150 170 C 190 200, 220 215, 250 230',
  'M150 170 C 110 230, 80 280, 70 330',
  'M420 120 C 470 160, 510 210, 520 260',
  'M420 120 C 480 100, 530 80, 560 60',
  'M300 380 C 360 420, 420 450, 470 470',
  'M300 380 C 240 430, 190 470, 150 500',
  'M420 120 C 360 200, 320 300, 300 380',
]

/** A rota com a entrega em movimento. */
const ROTA_ATIVA = 'M300 380 C 380 340, 460 300, 520 260'

function Etiqueta({ x, y }: { x: number; y: number }) {
  // Mesma silhueta da marca: canto superior direito cortado.
  return (
    <g transform={`translate(${x - 13} ${y - 13})`}>
      <path
        d="M4 0h12.4c.5 0 1 .2 1.4.6l7.6 7.6c.4.4.6.9.6 1.4V22a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z"
        fill="var(--sidebar-indicator)"
      />
      <path d="M13 7.5c-1.8 2.4-3.9 5-3.9 7.5a3.9 3.9 0 0 0 7.8 0c0-2.5-2.1-5.1-3.9-7.5Z" fill="var(--sidebar)" />
    </g>
  )
}

function DesenhoDaRede() {
  return (
    <svg viewBox="0 0 620 560" className="h-auto w-full max-w-[560px]" aria-hidden="true">
      <defs>
        <pattern id="pontos-da-grade" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.1" fill="var(--sidebar-muted)" opacity="0.22" />
        </pattern>
      </defs>
      <rect width="620" height="560" fill="url(#pontos-da-grade)" />

      {ROTAS.map((d) => (
        <path key={d} d={d} fill="none" stroke="var(--sidebar-muted)" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="2 6" strokeLinecap="round" />
      ))}
      <path d={ROTA_ATIVA} fill="none" stroke="var(--sidebar-indicator)" strokeWidth="2.25" strokeLinecap="round" />

      {HOSPITAIS.map(({ x, y }) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="11" fill="var(--sidebar)" stroke="var(--sidebar-foreground)" strokeWidth="1.75" />
          <path d={`M${x} ${y - 4.5}v9M${x - 4.5} ${y}h9`} stroke="var(--sidebar-foreground)" strokeWidth="1.75" strokeLinecap="round" />
        </g>
      ))}
      {HEMOCENTROS.map(({ x, y }) => (
        <Etiqueta key={`${x}-${y}`} x={x} y={y} />
      ))}

      {/* A entrega: um ponto que percorre a rota ativa (offset-path, CSS). */}
      <circle
        r="6"
        fill="var(--sidebar-indicator)"
        stroke="var(--sidebar)"
        strokeWidth="3"
        className="motion-safe:animate-[percurso_6s_cubic-bezier(0.45,0,0.25,1)_infinite]"
        style={{ offsetPath: `path('${ROTA_ATIVA}')`, offsetDistance: '58%' }}
      />
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
        <div className="flex flex-1 items-center justify-center px-12 pt-16">
          <DesenhoDaRede />
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
              <svg viewBox="0 0 26 26" className="size-3.5" aria-hidden="true">
                <path d="M4 0h12.4c.5 0 1 .2 1.4.6l7.6 7.6c.4.4.6.9.6 1.4V22a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z" fill="var(--sidebar-indicator)" />
              </svg>
              Hemocentro
            </li>
            <li className="flex items-center gap-2">
              <span className="size-3 rounded-full border-[1.5px] border-sidebar-foreground" aria-hidden="true" />
              Hospital
            </li>
            <li className="flex items-center gap-2">
              <span className="h-0.5 w-4 rounded-full bg-sidebar-indicator" aria-hidden="true" />
              Entrega em rota
            </li>
          </ul>
        )}
      </div>
    </aside>
  )
}
