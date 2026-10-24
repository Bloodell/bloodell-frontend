/**
 * Traducao do vocabulario da API (CONCENTRADO_HEMACIAS, NA_FILA...) para texto
 * de gente, e de status para o tom visual da etiqueta. A tela nunca mostra o
 * enum cru.
 */
import type { Prioridade, TipoComponente } from './api/tipos'

export type Tom = 'neutro' | 'sucesso' | 'atencao' | 'erro' | 'info'

export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export const COMPONENTES: { valor: TipoComponente; rotulo: string; validadeDias: number }[] = [
  { valor: 'CONCENTRADO_HEMACIAS', rotulo: 'Concentrado de hemácias', validadeDias: 42 },
  { valor: 'PLASMA', rotulo: 'Plasma', validadeDias: 365 },
  { valor: 'PLAQUETAS', rotulo: 'Plaquetas', validadeDias: 5 },
]

export const PRIORIDADES: { valor: Prioridade; rotulo: string; descricao: string }[] = [
  { valor: 'EMERGENCIA', rotulo: 'Emergência', descricao: 'Risco imediato à vida' },
  { valor: 'URGENTE', rotulo: 'Urgente', descricao: 'Atendimento nas próximas horas' },
  { valor: 'ELETIVA', rotulo: 'Eletiva', descricao: 'Procedimento programado' },
]

const ROTULOS: Record<string, string> = {
  CONCENTRADO_HEMACIAS: 'Concentrado de hemácias',
  PLASMA: 'Plasma',
  PLAQUETAS: 'Plaquetas',
  EMERGENCIA: 'Emergência',
  URGENTE: 'Urgente',
  ELETIVA: 'Eletiva',
  RECEBIDA: 'Recebida',
  ARMAZENADA: 'Armazenada',
  DISPONIVEL: 'Disponível',
  RESERVADA: 'Reservada',
  ALOCADA: 'Alocada',
  DESPACHADA: 'Despachada',
  EM_TRANSPORTE: 'Em transporte',
  ENTREGUE: 'Entregue',
  DESCARTADA: 'Descartada',
  VENCIDA: 'Vencida',
  CRIADA: 'Criada',
  NA_FILA: 'Na fila',
  EM_PROCESSAMENTO: 'Em processamento',
  EM_ROTA: 'Em rota',
  ATENDIDA: 'Atendida',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada',
  PLANEJADA: 'Planejada',
  EM_MANUTENCAO: 'Em manutenção',
  CRITICO: 'Crítico',
  ATENCAO: 'Atenção',
  HEMOCENTRO: 'Hemocentro',
  HOSPITAL: 'Hospital',
}

/** Rotulo legivel de qualquer enum da API; desconhecido vira "Texto assim". */
export function rotulo(valor: string | null | undefined): string {
  if (!valor) return '—'
  return ROTULOS[valor] ?? valor.charAt(0) + valor.slice(1).toLowerCase().replaceAll('_', ' ')
}

export function tomDoEstadoDaBolsa(status: string): Tom {
  switch (status) {
    case 'DISPONIVEL':
    case 'ENTREGUE':
      return 'sucesso'
    case 'RESERVADA':
    case 'ALOCADA':
    case 'DESPACHADA':
    case 'EM_TRANSPORTE':
      return 'info'
    case 'VENCIDA':
    case 'DESCARTADA':
      return 'erro'
    default:
      return 'neutro'
  }
}

export function tomDaPrioridade(prioridade: string): Tom {
  switch (prioridade) {
    case 'EMERGENCIA':
      return 'erro'
    case 'URGENTE':
      return 'atencao'
    default:
      return 'neutro'
  }
}

export function tomDoStatusDaRequisicao(status: string): Tom {
  switch (status) {
    case 'ATENDIDA':
      return 'sucesso'
    case 'ALOCADA':
    case 'EM_ROTA':
      return 'info'
    case 'NA_FILA':
    case 'EM_PROCESSAMENTO':
      return 'atencao'
    case 'REJEITADA':
    case 'CANCELADA':
      return 'erro'
    default:
      return 'neutro'
  }
}

export function tomDaEntrega(status: string): Tom {
  switch (status) {
    case 'ENTREGUE':
      return 'sucesso'
    case 'DESPACHADA':
    case 'EM_TRANSPORTE':
      return 'info'
    case 'CANCELADA':
      return 'erro'
    default:
      return 'neutro'
  }
}

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const formatoNumero = new Intl.NumberFormat('pt-BR')

/** "2026-12-03" vira "03 de dez. de 2026" sem deslocar o dia pelo fuso. */
export function data(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return formatoData.format(new Date(ano, mes - 1, dia))
}

export function dataHora(iso: string): string {
  return formatoDataHora.format(new Date(iso))
}

export function numero(valor: number): string {
  return formatoNumero.format(valor)
}

export function plural(quantidade: number, singular: string, pluralTexto = `${singular}s`): string {
  return `${numero(quantidade)} ${quantidade === 1 ? singular : pluralTexto}`
}
