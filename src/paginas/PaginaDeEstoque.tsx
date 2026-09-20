import { useState } from 'react'

import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Etiqueta } from '../componentes/Etiqueta'
import { tomDoEstadoDaBolsa } from '../componentes/tons'
import { Cabecalho } from '../componentes/Layout'
import type { Bolsa, ItemDeEstoque, Pagina, TipoComponente, Unidade } from '../tipos/api'

const COMPONENTES: { valor: TipoComponente | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todos os componentes' },
  { valor: 'CONCENTRADO_HEMACIAS', rotulo: 'Concentrado de hemácias' },
  { valor: 'PLASMA', rotulo: 'Plasma' },
  { valor: 'PLAQUETAS', rotulo: 'Plaquetas' },
]

/** Estoque real, lido da API. Nenhum dado desta tela é mockado. */
export function PaginaDeEstoque() {
  const [componente, setComponente] = useState<TipoComponente | ''>('')
  const [unidadeId, setUnidadeId] = useState('')
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(true)

  const unidades = useRecurso<Unidade[]>('/hemocentros')

  const filtros = new URLSearchParams()
  if (componente) filtros.set('componente', componente)
  if (unidadeId) filtros.set('unidadeId', unidadeId)
  const itens = useRecurso<ItemDeEstoque[]>(`/estoques?${filtros.toString()}`)

  const filtrosDeBolsa = new URLSearchParams({ size: '50' })
  if (componente) filtrosDeBolsa.set('componente', componente)
  if (unidadeId) filtrosDeBolsa.set('unidadeId', unidadeId)
  if (somenteDisponiveis) filtrosDeBolsa.set('status', 'DISPONIVEL')
  const bolsas = useRecurso<Pagina<Bolsa>>(`/bolsas?${filtrosDeBolsa.toString()}`)

  return (
    <>
      <Cabecalho
        titulo="Estoque"
        descricao="Posição por unidade, tipo e componente, e as bolsas na ordem de chegada"
      />

      <div className="pagina">
        <AvisoAcademico />

        <Cartao titulo="Filtros">
          <div className="formulario">
            <label className="campo">
              <span className="campo__rotulo">Hemocentro</span>
              <select value={unidadeId} onChange={(evento) => setUnidadeId(evento.target.value)}>
                <option value="">Todos</option>
                {(unidades.dados ?? []).map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>
                    {unidade.nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span className="campo__rotulo">Componente</span>
              <select
                value={componente}
                onChange={(evento) => setComponente(evento.target.value as TipoComponente | '')}
              >
                {COMPONENTES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span className="campo__rotulo">Situação das bolsas</span>
              <select
                value={somenteDisponiveis ? 'disponiveis' : 'todas'}
                onChange={(evento) => setSomenteDisponiveis(evento.target.value === 'disponiveis')}
              >
                <option value="disponiveis">Somente disponíveis</option>
                <option value="todas">Todas</option>
              </select>
            </label>
          </div>
        </Cartao>

        <Cartao
          titulo="Posição de estoque"
          ajuda="Contagem por unidade, tipo sanguíneo e componente"
        >
          <Estado
            carregando={itens.carregando}
            erro={itens.erro}
            vazio={(itens.dados ?? []).length === 0}
            mensagemVazio="Nenhuma contagem de estoque para os filtros escolhidos."
            aoTentarNovamente={itens.recarregar}
          >
            <div className="tabela__rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Unidade</th>
                    <th>Tipo</th>
                    <th>Componente</th>
                    <th>Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {(itens.dados ?? []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.unidadeNome}</td>
                      <td><strong>{item.tipoSanguineo}</strong></td>
                      <td>{item.componente}</td>
                      <td>{item.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Estado>
        </Cartao>

        <Cartao
          titulo="Bolsas"
          ajuda="Na ordem de chegada ao estoque — a mesma ordem da lista encadeada da AED"
        >
          <Estado
            carregando={bolsas.carregando}
            erro={bolsas.erro}
            vazio={(bolsas.dados?.content ?? []).length === 0}
            mensagemVazio="Nenhuma bolsa encontrada com esses filtros."
            aoTentarNovamente={bolsas.recarregar}
          >
            <div className="tabela__rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Chegada</th>
                    <th>Código</th>
                    <th>Tipo</th>
                    <th>Componente</th>
                    <th>Validade</th>
                    <th>Situação</th>
                    <th>Unidade</th>
                  </tr>
                </thead>
                <tbody>
                  {(bolsas.dados?.content ?? []).map((bolsa) => (
                    <tr key={bolsa.id}>
                      <td>#{bolsa.sequenciaEntrada}</td>
                      <td><code>{bolsa.codigo}</code></td>
                      <td><strong>{bolsa.tipoSanguineo}</strong></td>
                      <td>{bolsa.componente}</td>
                      <td>
                        {bolsa.dataValidade}
                        <div className="cartao__ajuda">
                          {bolsa.diasParaVencer >= 0
                            ? `vence em ${bolsa.diasParaVencer} dia(s)`
                            : `vencida há ${Math.abs(bolsa.diasParaVencer)} dia(s)`}
                        </div>
                      </td>
                      <td>
                        <Etiqueta texto={bolsa.status} tom={tomDoEstadoDaBolsa(bolsa.status)} />
                      </td>
                      <td>{bolsa.unidadeAtualNome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rodape-tabela">
              Mostrando {bolsas.dados?.content.length ?? 0} de{' '}
              {bolsas.dados?.totalElements ?? 0} bolsa(s). A coluna “chegada” é a ordem de
              entrada no estoque — <strong>não</strong> é ordem de validade: priorizar por
              validade é FEFO, conteúdo da Unidade 2.
            </div>
          </Estado>
        </Cartao>
      </div>
    </>
  )
}
