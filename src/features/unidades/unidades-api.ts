import { api } from '@/lib/api/cliente'
import type { EntradaUnidade, Unidade } from '@/lib/api/tipos'

export type TipoDeUnidade = 'hemocentros' | 'hospitais'

export function tipoDaUnidade(unidade: Unidade): TipoDeUnidade {
  return unidade.tipo === 'HEMOCENTRO' ? 'hemocentros' : 'hospitais'
}

/**
 * So cadastro. A edicao (PUT) substitui o endereco inteiro, mas o GET nao
 * devolve logradouro, numero, bairro e CEP: editar por aqui apagaria esses
 * campos. Fica bloqueada ate o backend expor o endereco completo (B1).
 */
export function cadastrarUnidade(tipo: TipoDeUnidade, entrada: EntradaUnidade): Promise<Unidade> {
  return api.enviar<Unidade>(`/${tipo}`, entrada)
}

/** 409 quando ha doacoes, bolsas, requisicoes, veiculos ou entregas vinculadas. */
export function removerUnidade(unidade: Unidade): Promise<void> {
  return api.remover(`/${tipoDaUnidade(unidade)}/${unidade.id}`)
}
