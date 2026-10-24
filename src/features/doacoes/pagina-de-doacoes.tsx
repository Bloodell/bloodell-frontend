'use client'

import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { EstadoVazio } from '@/components/feedback/estados'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Doacao, Unidade } from '@/lib/api/tipos'
import { COMPONENTES, dataHora, rotulo } from '@/lib/formatos'
import { FormularioDeDoacao } from './formulario-de-doacao'
import { ResultadoDaDoacao } from './resultado-da-doacao'

/** UC1 -- registrar doacao sintetica; cada componente marcado vira uma bolsa. */
export function PaginaDeDoacoes() {
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const doacoes = useRecurso<Doacao[]>('/doacoes')
  const [ultima, setUltima] = useState<Doacao | null>(null)

  const nomeDoHemocentro = new Map((hemocentros.dados ?? []).map((unidade) => [unidade.id, unidade.nome]))
  // Mais recentes primeiro.
  const ordenadas = [...(doacoes.dados ?? [])].sort((a, b) => b.id - a.id)
  const paginacao = usePaginacaoLocal(ordenadas, 8)

  const colunas: Coluna<Doacao>[] = [
    {
      id: 'codigo',
      cabecalho: 'Código',
      celula: (doacao) => <span className="font-mono text-[13px]">{doacao.codigo}</span>,
      esqueleto: 'w-28',
    },
    {
      id: 'tipo',
      cabecalho: 'Tipo',
      celula: (doacao) => <span className="font-mono text-[13px] font-semibold">{doacao.tipoSanguineo}</span>,
      esqueleto: 'w-8',
    },
    {
      id: 'hemocentro',
      cabecalho: 'Hemocentro',
      celula: (doacao) => nomeDoHemocentro.get(doacao.hemocentroId) ?? `#${doacao.hemocentroId}`,
      className: 'hidden md:table-cell',
      esqueleto: 'w-36',
    },
    {
      id: 'bolsas',
      cabecalho: 'Bolsas geradas',
      celula: (doacao) => (
        <span className="text-muted-foreground">
          {doacao.bolsasGeradas.map((bolsa) => rotulo(bolsa.componente)).join(', ')}
        </span>
      ),
      className: 'hidden lg:table-cell',
      esqueleto: 'w-44',
    },
    {
      id: 'volume',
      cabecalho: 'Volume',
      celula: (doacao) => `${doacao.volumeMl} ml`,
      className: 'text-right',
      esqueleto: 'ml-auto w-14',
    },
    {
      id: 'quando',
      cabecalho: 'Registrada',
      celula: (doacao) => (
        <span className="text-muted-foreground">{doacao.dataHora ? dataHora(doacao.dataHora) : '—'}</span>
      ),
      className: 'text-right',
      esqueleto: 'ml-auto w-24',
    },
  ]

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Doações"
        descricao="Registre uma doação sintética. Cada componente marcado vira uma bolsa, com validade calculada a partir da coleta."
      />

      <AvisoAcademico complemento="Os dados informados aqui simulam uma coleta e não representam uma doação real." />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Nova doação</CardTitle>
              <CardDescription>Os campos seguem as mesmas regras de validação da API.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FormularioDeDoacao
              hemocentros={hemocentros}
              aoRegistrar={(doacao) => {
                setUltima(doacao)
                doacoes.recarregar()
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {ultima && <ResultadoDaDoacao key={ultima.id} doacao={ultima} />}
          <Card>
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
                  Regra de validade
                </CardTitle>
                <CardDescription>Contada a partir da data da coleta.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y text-sm">
                {COMPONENTES.map((componente) => (
                  <li key={componente.valor} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <span className="text-muted-foreground">{componente.rotulo}</span>
                    <span className="font-medium tabular-nums">{componente.validadeDias} dias</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b pb-4">
          <div>
            <CardTitle>Doações registradas</CardTitle>
            <CardDescription>As mais recentes primeiro.</CardDescription>
          </div>
        </CardHeader>
        <TabelaDeDados
          colunas={colunas}
          linhas={paginacao.itensDaPagina}
          chave={(doacao) => doacao.id}
          carregando={doacoes.carregando}
          erro={doacoes.erro}
          aoTentarNovamente={doacoes.recarregar}
          linhasDoEsqueleto={4}
          vazio={<EstadoVazio titulo="Nenhuma doação registrada" descricao="Use o formulário acima para registrar a primeira." />}
          rodape={
            paginacao.totalPaginas > 1 && (
              <Paginacao
                pagina={paginacao.pagina}
                totalPaginas={paginacao.totalPaginas}
                totalItens={paginacao.totalItens}
                tamanho={paginacao.tamanho}
                aoMudar={paginacao.setPagina}
              />
            )
          }
        />
      </Card>
    </div>
  )
}
