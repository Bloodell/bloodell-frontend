import {
  Boxes,
  Building2,
  ClipboardList,
  Droplet,
  LayoutGrid,
  Network,
  Thermometer,
  Truck,
  type LucideIcon,
} from 'lucide-react'

export interface ItemDeNavegacao {
  caminho: string
  rotulo: string
  icone: LucideIcon
}

export const GRUPOS_DE_NAVEGACAO: { titulo: string; itens: ItemDeNavegacao[] }[] = [
  {
    titulo: 'Operação',
    itens: [
      { caminho: '/', rotulo: 'Visão geral', icone: LayoutGrid },
      { caminho: '/estoque', rotulo: 'Estoque', icone: Boxes },
      { caminho: '/doacoes', rotulo: 'Doações', icone: Droplet },
      { caminho: '/requisicoes', rotulo: 'Requisições', icone: ClipboardList },
    ],
  },
  {
    titulo: 'Logística',
    itens: [
      { caminho: '/entregas', rotulo: 'Entregas', icone: Truck },
      { caminho: '/cadeia-fria', rotulo: 'Cadeia fria', icone: Thermometer },
    ],
  },
  {
    titulo: 'Rede',
    itens: [
      { caminho: '/unidades', rotulo: 'Unidades', icone: Building2 },
      { caminho: '/algoritmos', rotulo: 'Estruturas (AED)', icone: Network },
    ],
  },
]

export const TODAS_AS_PAGINAS = GRUPOS_DE_NAVEGACAO.flatMap((grupo) => grupo.itens)

/** "/estoque/" e "/estoque" sao a mesma pagina (o export usa barra no fim). */
export function normalizarCaminho(caminho: string): string {
  return caminho.length > 1 ? caminho.replace(/\/+$/, '') : caminho
}
