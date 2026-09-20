import type { ProblemaApi } from '../tipos/api'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ErroDaApi extends Error {
  readonly problema: ProblemaApi

  constructor(problema: ProblemaApi) {
    super(problema.detail || problema.title)
    this.name = 'ErroDaApi'
    this.problema = problema
  }

  /** Mensagem pronta para mostrar na tela, incluindo os erros de campo. */
  get mensagemAmigavel(): string {
    if (this.problema.campos?.length) {
      const campos = this.problema.campos
        .map((erro) => `${erro.campo}: ${erro.mensagem}`)
        .join(' · ')
      return `${this.problema.detail} (${campos})`
    }
    return this.problema.detail || this.problema.title
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...(opcoes.headers ?? {}),
      },
    })
  } catch {
    throw new ErroDaApi({
      type: 'https://bloodell.cesar.school/erros/sem-conexao',
      title: 'Sem conexao com a API',
      status: 0,
      detail:
        'Nao foi possivel falar com a API do Bloodell. Confira se o backend esta rodando em http://127.0.0.1:8080.',
    })
  }

  if (resposta.status === 204) {
    return undefined as T
  }

  const texto = await resposta.text()
  const corpo = texto ? JSON.parse(texto) : null

  if (!resposta.ok) {
    throw new ErroDaApi(
      (corpo as ProblemaApi) ?? {
        type: 'https://bloodell.cesar.school/erros/desconhecido',
        title: 'Erro inesperado',
        status: resposta.status,
        detail: `A API respondeu ${resposta.status} sem corpo.`,
      },
    )
  }

  return corpo as T
}

export const api = {
  buscar: <T>(caminho: string) => requisitar<T>(caminho),
  enviar: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, {
      method: 'POST',
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    }),
}