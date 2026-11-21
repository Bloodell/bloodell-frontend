import { api } from '@/lib/api/cliente'
import type { Pagina, Perfil, UsuarioAtual, VinculosDeUnidade } from '@/lib/api/tipos'

export const TAMANHO_DA_PAGINA_DE_USUARIOS = 20

export interface EntradaDeCadastro {
  nome: string
  email: string
  perfil: Perfil
  senha: string
}

export type EntradaDeAtualizacao = Partial<Pick<UsuarioAtual, 'nome' | 'email' | 'perfil'>>

export function caminhoDaListaDeUsuarios(pagina: number, tamanho = TAMANHO_DA_PAGINA_DE_USUARIOS): string {
  return `/usuarios?page=${pagina}&size=${tamanho}`
}

export function cadastrarUsuario(entrada: EntradaDeCadastro): Promise<UsuarioAtual> {
  return api.enviar<UsuarioAtual>('/usuarios', entrada)
}

export function atualizarUsuario(id: number, entrada: EntradaDeAtualizacao): Promise<UsuarioAtual> {
  return api.alterar<UsuarioAtual>(`/usuarios/${id}`, entrada)
}

export function substituirVinculos(id: number, unidadeIds: number[]): Promise<VinculosDeUnidade> {
  return api.substituir<VinculosDeUnidade>(`/usuarios/${id}/unidades`, { unidadeIds })
}

export function listarUsuarios(pagina: number): Promise<Pagina<UsuarioAtual>> {
  return api.buscar<Pagina<UsuarioAtual>>(caminhoDaListaDeUsuarios(pagina))
}

// --- Regras do DTO (UsuarioDtos.Cadastro / Atualizacao) ----------------------

export const LIMITES = { nome: 120, email: 160, senhaMinima: 12, senhaMaximaBytes: 72 } as const

export function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface ErrosDeUsuario {
  nome?: string
  email?: string
  perfil?: string
  senha?: string
}

export function validarCadastro(valores: { nome: string; email: string; perfil: string; senha: string }): ErrosDeUsuario {
  const erros: ErrosDeUsuario = { ...validarDados(valores) }
  if (!valores.senha) erros.senha = 'Defina uma senha inicial.'
  else if (valores.senha.length < LIMITES.senhaMinima) erros.senha = `Use pelo menos ${LIMITES.senhaMinima} caracteres.`
  else if (bytesUtf8(valores.senha) > LIMITES.senhaMaximaBytes)
    erros.senha = `Senha longa demais: no máximo ${LIMITES.senhaMaximaBytes} bytes (acentos e emoji contam mais de 1).`
  return erros
}

export function validarDados(valores: { nome: string; email: string; perfil: string }): ErrosDeUsuario {
  const erros: ErrosDeUsuario = {}
  const nome = valores.nome.trim()
  const email = valores.email.trim()
  if (!nome) erros.nome = 'Informe o nome.'
  else if (nome.length > LIMITES.nome) erros.nome = `No máximo ${LIMITES.nome} caracteres.`
  if (!email) erros.email = 'Informe o e-mail.'
  else if (email.length > LIMITES.email) erros.email = `No máximo ${LIMITES.email} caracteres.`
  else if (!EMAIL.test(email)) erros.email = 'Confira o e-mail: falta algo como nome@dominio.'
  if (!valores.perfil) erros.perfil = 'Escolha o perfil.'
  return erros
}

/**
 * PATCH so com o que mudou. O backend recusa null, campos extras e corpo
 * vazio; e-mail e comparado ja normalizado (minusculo, sem espacos).
 */
export function diferencasDoUsuario(
  original: UsuarioAtual,
  valores: { nome: string; email: string; perfil: Perfil },
): EntradaDeAtualizacao {
  const mudancas: EntradaDeAtualizacao = {}
  const nome = valores.nome.trim()
  const email = valores.email.trim().toLowerCase()
  if (nome !== original.nome) mudancas.nome = nome
  if (email !== original.email.toLowerCase()) mudancas.email = email
  if (valores.perfil !== original.perfil) mudancas.perfil = valores.perfil
  return mudancas
}
