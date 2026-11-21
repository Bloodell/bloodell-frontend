import { api } from '@/lib/api/cliente'
import type { EntradaVeiculo, Veiculo } from '@/lib/api/tipos'

/** Cadastra (id null) ou atualiza o veiculo. Status nao e editavel por aqui. */
export function salvarVeiculo(id: number | null, entrada: EntradaVeiculo): Promise<Veiculo> {
  return id === null ? api.enviar<Veiculo>('/veiculos', entrada) : api.substituir<Veiculo>(`/veiculos/${id}`, entrada)
}

/** 409 se tem entregas/telemetria; 422 se esta em rota. A API decide. */
export function removerVeiculo(id: number): Promise<void> {
  return api.remover(`/veiculos/${id}`)
}
