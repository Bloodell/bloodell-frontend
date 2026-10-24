'use client'

import { Building2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { BarraDeFiltros, CampoDeBusca } from '@/components/data-table/barra-de-filtros'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { usePaginacaoLocal } from '@/components/data-table/use-paginacao-local'
import { AvisoAcademico } from '@/components/feedback/aviso-academico'
import { EstadoVazio } from '@/components/feedback/estados'
import { GrupoDeOpcoes } from '@/components/form/opcoes'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Unidade } from '@/lib/api/tipos'
import { FormularioDeUnidade, type TipoDeUnidade } from './formulario-de-unidade'

const colunas: Coluna<Unidade>[] = [
  {
    id: 'nome',
    cabecalho: 'Nome',
    celula: (unidade) => <span className="font-medium">{unidade.nome}</span>,
    esqueleto: 'w-40',
  },
  {
    id: 'local',
    cabecalho: 'Cidade',
    celula: (unidade) => (
      <span className="text-muted-foreground">
        {unidade.cidade}/{unidade.uf}
      </span>
    ),
    esqueleto: 'w-28',
  },
  {
    id: 'coordenada',
    cabecalho: 'Coordenada',
    celula: (unidade) => (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <MapPin className="size-3.5" aria-hidden="true" />
        {unidade.latitude.toFixed(4)}, {unidade.longitude.toFixed(4)}
      </span>
    ),
    className: 'hidden md:table-cell',
    esqueleto: 'w-36',
  },
]

/** Rede sintetica: hemocentros que armazenam e hospitais que solicitam. */
export function PaginaDeUnidades() {
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const hospitais = useRecurso<Unidade[]>('/hospitais')
  const [aba, setAba] = useState<TipoDeUnidade>('hemocentros')
  const [busca, setBusca] = useState('')

  const recurso = aba === 'hemocentros' ? hemocentros : hospitais
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const filtradas = (recurso.dados ?? []).filter((unidade) =>
    `${unidade.nome} ${unidade.cidade} ${unidade.uf}`.toLocaleLowerCase('pt-BR').includes(termo),
  )
  const paginacao = usePaginacaoLocal(filtradas, 8)

  return (
    <div className="space-y-8">
      <Cabecalho titulo="Unidades" descricao="Hemocentros e hospitais da rede sintética, com as coordenadas usadas pela logística." />

      <AvisoAcademico />

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cadastrar unidade</CardTitle>
              <CardDescription>A coordenada posiciona a unidade nas entregas.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FormularioDeUnidade
              aoCadastrar={(tipo) => {
                setAba(tipo)
                ;(tipo === 'hemocentros' ? hemocentros : hospitais).recarregar()
              }}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div>
              <CardTitle>Rede</CardTitle>
              <CardDescription>
                {aba === 'hemocentros'
                  ? 'Recebem doações, armazenam bolsas e despacham entregas.'
                  : 'Solicitam hemocomponentes e recebem as entregas.'}
              </CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <GrupoDeOpcoes
                nome="aba"
                rotulo="Tipo de unidade exibido"
                valor={aba}
                aoMudar={(valor) => {
                  setAba(valor)
                  paginacao.setPagina(0)
                }}
                opcoes={[
                  { valor: 'hemocentros', rotulo: `Hemocentros${hemocentros.dados ? ` · ${hemocentros.dados.length}` : ''}` },
                  { valor: 'hospitais', rotulo: `Hospitais${hospitais.dados ? ` · ${hospitais.dados.length}` : ''}` },
                ]}
              />
            </div>
          </CardHeader>
          <BarraDeFiltros className="border-t" ativos={busca ? 1 : 0} aoLimpar={() => setBusca('')}>
            <CampoDeBusca valor={busca} aoMudar={setBusca} placeholder="Nome, cidade ou UF" rotulo="Buscar unidade" />
          </BarraDeFiltros>
          <TabelaDeDados
            colunas={colunas}
            linhas={paginacao.itensDaPagina}
            chave={(unidade) => unidade.id}
            carregando={recurso.carregando}
            erro={recurso.erro}
            aoTentarNovamente={recurso.recarregar}
            linhasDoEsqueleto={5}
            vazio={
              <EstadoVazio
                icone={Building2}
                titulo={termo ? 'Nenhuma unidade encontrada' : `Nenhum ${aba === 'hemocentros' ? 'hemocentro' : 'hospital'} cadastrado`}
                descricao={termo ? 'Tente outro termo de busca.' : 'Cadastre a primeira unidade no formulário ao lado.'}
              />
            }
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
    </div>
  )
}
