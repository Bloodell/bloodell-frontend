import type { Perfil, UsuarioAtual } from '@/lib/api/tipos'

/** Rotulo de cada perfil, como a equipe fala. */
export const PERFIS: { valor: Perfil; rotulo: string; descricao: string }[] = [
  {
    valor: 'OPERADOR_HEMOCENTRO',
    rotulo: 'Operador de hemocentro',
    descricao: 'Doações, estoque e alocação nos hemocentros vinculados.',
  },
  {
    valor: 'USUARIO_HOSPITAL',
    rotulo: 'Usuário de hospital',
    descricao: 'Requisições e acompanhamento do hospital vinculado.',
  },
  {
    valor: 'LOGISTICA',
    rotulo: 'Logística',
    descricao: 'Entregas, veículos e cadeia fria das unidades vinculadas.',
  },
  { valor: 'ADMIN', rotulo: 'Administrador', descricao: 'Acesso global, contas da equipe e cadastro de unidades.' },
]

export function rotuloDoPerfil(perfil: Perfil | string): string {
  return PERFIS.find((item) => item.valor === perfil)?.rotulo ?? perfil
}

/** "Maria da Silva Souza" vira "MS". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

/**
 * Para onde voltar depois do login. Aceita so caminho interno da propria
 * interface: nada de "//outro-site", URL absoluta ou o proprio /login.
 */
export function caminhoDeRetornoSeguro(bruto: string | null | undefined): string {
  if (!bruto) return '/'
  if (!bruto.startsWith('/') || bruto.startsWith('//') || bruto.includes('\\')) return '/'
  if (/^\/login(\/|\?|$)/.test(bruto)) return '/'
  if (/[\u0000-\u001f]/.test(bruto)) return '/'
  return bruto
}

/**
 * Milissegundos ate o token expirar, com margem de 10 s para nao disparar uma
 * requisicao com token que vence no caminho.
 */
export function prazoDaSessao(expiresInSegundos: number): number {
  if (!Number.isFinite(expiresInSegundos) || expiresInSegundos <= 0) return 0
  return Math.max(0, expiresInSegundos * 1000 - 10_000)
}

// --- Permissoes ------------------------------------------------------------
// Espelham SO o que o backend realmente restringe. Esconder um botao melhora a
// experiencia; quem autoriza e o servidor (403).

export function ehAdministrador(usuario: UsuarioAtual | null): boolean {
  return usuario?.perfil === 'ADMIN'
}

/**
 * /usuarios e /usuarios/{id}/unidades exigem ADMIN e so existem com
 * autenticacao ligada; na demonstracao (auth desligada) o backend os nega.
 */
export function podeGerenciarUsuarios(usuario: UsuarioAtual | null, demonstracao: boolean): boolean {
  return !demonstracao && ehAdministrador(usuario)
}

/**
 * Cadastro de unidades, metricas de telemetria e seed exigem ADMIN quando a
 * autenticacao esta ligada; na demonstracao o backend libera.
 */
export function podeAdministrarRede(usuario: UsuarioAtual | null, demonstracao: boolean): boolean {
  return demonstracao || ehAdministrador(usuario)
}
