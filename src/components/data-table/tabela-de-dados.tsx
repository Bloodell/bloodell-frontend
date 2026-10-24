'use client'

import type { ReactNode } from 'react'
import { EstadoDeErro, EstadoVazio } from '@/components/feedback/estados'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface Coluna<T> {
  id: string
  cabecalho: ReactNode
  celula: (linha: T) => ReactNode
  className?: string
  /** Largura do bloco do skeleton, para o carregamento ter a forma da tabela. */
  esqueleto?: string
}

/**
 * Tabela com os tres estados que toda consulta tem: carregando (skeleton com
 * o desenho das colunas), erro (mensagem real da API) e vazio.
 */
export function TabelaDeDados<T>({
  colunas,
  linhas,
  chave,
  carregando,
  erro,
  aoTentarNovamente,
  vazio,
  linhasDoEsqueleto = 6,
  aoClicarLinha,
  rodape,
}: {
  colunas: Coluna<T>[]
  linhas: T[]
  chave: (linha: T) => string | number
  carregando: boolean
  erro?: string | null
  aoTentarNovamente?: () => void
  vazio: ReactNode
  linhasDoEsqueleto?: number
  aoClicarLinha?: (linha: T) => void
  rodape?: ReactNode
}) {
  if (erro) return <EstadoDeErro mensagem={erro} aoTentarNovamente={aoTentarNovamente} />

  const mostrarEsqueleto = carregando && linhas.length === 0

  if (!mostrarEsqueleto && linhas.length === 0) {
    return typeof vazio === 'string' ? <EstadoVazio titulo={vazio} /> : vazio
  }

  return (
    <>
      <div className={cn('transition-opacity', carregando && !mostrarEsqueleto && 'opacity-60')} aria-busy={carregando}>
        <Table>
          <TableHeader>
            <TableRow>
              {colunas.map((coluna) => (
                <TableHead key={coluna.id} className={coluna.className}>
                  {coluna.cabecalho}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {mostrarEsqueleto
              ? Array.from({ length: linhasDoEsqueleto }, (_, indice) => (
                  <TableRow key={`esqueleto-${indice}`} className="hover:bg-transparent">
                    {colunas.map((coluna) => (
                      <TableCell key={coluna.id} className={coluna.className}>
                        <Skeleton className={cn('h-4', coluna.esqueleto ?? 'w-24')} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : linhas.map((linha) => (
                  <TableRow
                    key={chave(linha)}
                    onClick={aoClicarLinha ? () => aoClicarLinha(linha) : undefined}
                    className={cn(aoClicarLinha && 'cursor-pointer')}
                  >
                    {colunas.map((coluna) => (
                      <TableCell key={coluna.id} className={coluna.className}>
                        {coluna.celula(linha)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
      {!mostrarEsqueleto && rodape}
    </>
  )
}
