import type { SVGProps } from 'react'

export type NomeIcone =
  | 'inicio' | 'estoque' | 'doacao' | 'requisicoes' | 'entregas'
  | 'unidades' | 'algoritmos' | 'busca' | 'menu' | 'fechar'
  | 'seta' | 'termometro' | 'grafico' | 'caminhao' | 'alerta'

const caminhos: Record<NomeIcone, React.ReactNode> = {
  inicio: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" /><path d="M9 21v-7h6v7" /></>,
  estoque: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 5V3h8v2M8 15h8" /></>,
  doacao: <><path d="M12 3c-3.5 4.4-6.5 7.7-6.5 11a6.5 6.5 0 0 0 13 0C18.5 10.7 15.5 7.4 12 3Z" /><path d="M9 15a3 3 0 0 0 3 3" /></>,
  requisicoes: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4" /></>,
  entregas: <><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
  unidades: <><path d="M4 21V6l8-3 8 3v15M2 21h20M9 21v-5h6v5M8 8h1m6 0h1M8 12h1m6 0h1" /></>,
  algoritmos: <><rect x="3" y="4" width="7" height="7" rx="1" /><rect x="14" y="4" width="7" height="7" rx="1" /><rect x="8.5" y="15" width="7" height="7" rx="1" /><path d="M6.5 11v2h5.5v2M17.5 11v2H12" /></>,
  busca: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  fechar: <path d="M5 5l14 14M19 5 5 19" />,
  seta: <path d="M5 12h14m-6-6 6 6-6 6" />,
  termometro: <><path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0Z" /><path d="M12 9v8" /></>,
  grafico: <><path d="M4 20V4M4 20h16M8 16v-5M13 16V7M18 16V9" /></>,
  caminhao: <><path d="M3 7h11v11H3zM14 11h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
  alerta: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3h.01" /></>,
}

export function Icone({ nome, ...props }: SVGProps<SVGSVGElement> & { nome: NomeIcone }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {caminhos[nome]}
    </svg>
  )
}

export function Marca({ clara = false }: { clara?: boolean }) {
  return <span className={`marca${clara ? ' marca--clara' : ''}`}>
    <svg viewBox="0 0 32 38" width="27" height="32" aria-hidden="true">
      <path fill="#dc2626" d="M16 1C11 9 4 17 4 24a12 12 0 0 0 12 12c-5-2-8-6-8-12 0-5 4-12 8-23Z" />
      <path fill="currentColor" d="M18 4c5 7 10 14 10 20a12 12 0 0 1-12 12c5-3 8-8 8-13 0-6-3-13-6-19Z" />
      <path fill="none" stroke="#fff" strokeWidth="1.4" d="M16 32c1-7 4-12 8-16" />
    </svg>
    <span>Bloodell</span>
  </span>
}
