import type { ProblemaApi } from './tipos'

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1'
const TIPO_BASE = 'https://bloodell.cesar.school/erros'

export class ErroDaApi extends Error {
  readonly problema: ProblemaApi

  constructor(problema: ProblemaApi) {
    super(problema.detail || problema.title)
    this.name = 'ErroDaApi'
    this.problema = problema
  }

  /** Status HTTP da falha; 0 quando nem chegou a haver resposta (rede). */
  get status(): number {
    return this.problema.status
  }

  /** Erros de validacao por campo, no formato { campo: mensagem }. */
  get errosDeCampo(): Record<string, string> {
    return Object.fromEntries((this.problema.campos ?? []).map((erro) => [erro.campo, erro.mensagem]))
  }

  /** Mensagem pronta para mostrar na tela, incluindo os erros de campo. */
  get mensagemAmigavel(): string {
    if (this.problema.campos?.length) {
      const campos = this.problema.campos.map((erro) => `${erro.campo}: ${erro.mensagem}`).join(' · ')
      return `${this.problema.detail} (${campos})`
    }
    return this.problema.detail || this.problema.title
  }
}

/** Converte qualquer falha em texto para a tela, sem vazar stack trace. */
export function mensagemDeErro(falha: unknown, padrao: string): string {
  return falha instanceof ErroDaApi ? falha.mensagemAmigavel : padrao
}

/** Status HTTP de uma falha qualquer, ou null quando nao veio da API. */
export function statusDaFalha(falha: unknown): number | null {
  return falha instanceof ErroDaApi ? falha.status : null
}

// --- Credencial ------------------------------------------------------------
// O cliente nao conhece React nem guarda token: quem tem a sessao informa como
// obter o token atual e escuta quando a API diz que ele deixou de valer.

let obterToken: () => string | null = () => null
const ouvintesDeExpiracao = new Set<() => void>()

export function configurarCredencial(obter: () => string | null): void {
  obterToken = obter
}

/** Avisado quando uma requisicao AUTENTICADA recebe 401. Devolve o cancelamento. */
export function assinarSessaoExpirada(ouvinte: () => void): () => void {
  ouvintesDeExpiracao.add(ouvinte)
  return () => {
    ouvintesDeExpiracao.delete(ouvinte)
  }
}

// --- Requisicao ------------------------------------------------------------

interface Opcoes {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  /** Nao envia token nem trata 401 como sessao expirada (ex.: o proprio login). */
  anonima?: boolean
  sinal?: AbortSignal
}

function problemaSemCorpo(status: number, detalhe: string): ProblemaApi {
  return { type: `${TIPO_BASE}/desconhecido`, title: 'Erro inesperado', status, detail: detalhe }
}

function pareceProblema(valor: unknown): valor is ProblemaApi {
  return typeof valor === 'object' && valor !== null && 'status' in valor && ('detail' in valor || 'title' in valor)
}

async function requisitar<T>(caminho: string, { metodo = 'GET', corpo, anonima = false, sinal }: Opcoes = {}): Promise<T> {
  const token = anonima ? null : obterToken()
  const cabecalhos: Record<string, string> = { Accept: 'application/json, application/problem+json' }
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json'
  if (token) cabecalhos.Authorization = `Bearer ${token}`

  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      cache: 'no-store',
      signal: sinal,
    })
  } catch (falha) {
    if (falha instanceof DOMException && falha.name === 'AbortError') throw falha
    throw new ErroDaApi({
      type: `${TIPO_BASE}/sem-conexao`,
      title: 'Sem conexão com a API',
      status: 0,
      detail: 'Não foi possível falar com a API do Bloodell. Confira a conexão e tente novamente.',
    })
  }

  if (resposta.status === 401 && token) {
    ouvintesDeExpiracao.forEach((ouvinte) => ouvinte())
  }

  // 204/205 nao tem corpo: nao tentar ler JSON.
  if (resposta.status === 204 || resposta.status === 205) {
    return undefined as T
  }

  const texto = await resposta.text()
  let json: unknown = null
  let jsonValido = true
  if (texto) {
    try {
      json = JSON.parse(texto)
    } catch {
      jsonValido = false
    }
  }

  if (!resposta.ok) {
    // Um proxy pode devolver HTML; o status continua sendo a informacao que importa.
    if (pareceProblema(json)) throw new ErroDaApi({ ...json, status: resposta.status })
    const detalhe =
      resposta.status === 401
        ? 'Sua sessão expirou ou não é válida. Entre novamente.'
        : resposta.status === 403
          ? 'Você não tem permissão para esta operação.'
          : `A API respondeu ${resposta.status}${texto ? ' em formato inesperado' : ' sem corpo'}.`
    throw new ErroDaApi(problemaSemCorpo(resposta.status, detalhe))
  }

  if (!jsonValido) {
    throw new ErroDaApi({
      type: `${TIPO_BASE}/resposta-invalida`,
      title: 'Resposta inválida',
      status: resposta.status,
      detail: 'A API respondeu em um formato que a interface não reconhece.',
    })
  }

  return json as T
}

export const api = {
  buscar: <T>(caminho: string, sinal?: AbortSignal) => requisitar<T>(caminho, { sinal }),
  enviar: <T>(caminho: string, corpo?: unknown) => requisitar<T>(caminho, { metodo: 'POST', corpo }),
  substituir: <T>(caminho: string, corpo: unknown) => requisitar<T>(caminho, { metodo: 'PUT', corpo }),
  alterar: <T>(caminho: string, corpo: unknown) => requisitar<T>(caminho, { metodo: 'PATCH', corpo }),
  remover: (caminho: string) => requisitar<void>(caminho, { metodo: 'DELETE' }),
  /** Requisicao sem credencial: usada so pelo login. */
  enviarAnonimo: <T>(caminho: string, corpo?: unknown) => requisitar<T>(caminho, { metodo: 'POST', corpo, anonima: true }),
}
