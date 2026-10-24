'use client'

import { useState } from 'react'

/**
 * Paginacao no navegador para endpoints que devolvem lista inteira
 * (unidades, entregas, frota). Endpoints paginados pela API usam a pagina da
 * propria resposta.
 */
export function usePaginacaoLocal<T>(itens: T[], tamanho = 10) {
  const [paginaPedida, setPagina] = useState(0)
  const totalPaginas = Math.max(1, Math.ceil(itens.length / tamanho))
  // Se um filtro encolheu a lista, a pagina pedida pode nao existir mais.
  const pagina = Math.min(paginaPedida, totalPaginas - 1)

  return {
    pagina,
    setPagina,
    totalPaginas,
    totalItens: itens.length,
    tamanho,
    itensDaPagina: itens.slice(pagina * tamanho, (pagina + 1) * tamanho),
  }
}
