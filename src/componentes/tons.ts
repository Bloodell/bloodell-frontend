/**
 * Traducao de status do dominio para o tom visual da etiqueta.
 *
 * Fica em arquivo separado do componente porque sao funcoes, nao componentes --
 * separar mantem o recarregamento rapido do Vite funcionando bem.
 */
export type Tom = 'sucesso' | 'atencao' | 'erro' | 'neutro'

export function tomDoEstadoDaBolsa(status: string): Tom {
  switch (status) {
    case 'DISPONIVEL':
    case 'ENTREGUE':
      return 'sucesso'
    case 'RESERVADA':
    case 'ALOCADA':
    case 'DESPACHADA':
    case 'EM_TRANSPORTE':
      return 'atencao'
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
    case 'ALOCADA':
      return 'sucesso'
    case 'NA_FILA':
    case 'EM_PROCESSAMENTO':
    case 'EM_ROTA':
      return 'atencao'
    case 'REJEITADA':
    case 'CANCELADA':
      return 'erro'
    default:
      return 'neutro'
  }
}
