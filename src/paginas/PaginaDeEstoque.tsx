import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Etiqueta } from '../componentes/Etiqueta'
import { tomDoEstadoDaBolsa } from '../componentes/tons'
import { Cabecalho } from '../componentes/Layout'
import type { Bolsa, EventoDeRastreabilidade, ItemDeEstoque, Pagina, TipoComponente, Unidade } from '../tipos/api'

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
  const [pagina, setPagina] = useState(0)
  const [bolsaSelecionada, setBolsaSelecionada] = useState<Bolsa | null>(null)
  const [parametros, definirParametros] = useSearchParams()
  const busca = parametros.get('busca') ?? ''

  const unidades = useRecurso<Unidade[]>('/hemocentros')

  const filtros = new URLSearchParams()
  if (componente) filtros.set('componente', componente)
  if (unidadeId) filtros.set('unidadeId', unidadeId)
  const itens = useRecurso<ItemDeEstoque[]>(`/estoques?${filtros.toString()}`)

  const filtrosDeBolsa = new URLSearchParams({ size: '20', page: String(pagina) })
  if (componente) filtrosDeBolsa.set('componente', componente)
  if (unidadeId) filtrosDeBolsa.set('unidadeId', unidadeId)
  if (somenteDisponiveis) filtrosDeBolsa.set('status', 'DISPONIVEL')
  const bolsas = useRecurso<Pagina<Bolsa>>(`/bolsas?${filtrosDeBolsa.toString()}`)
  const rastreabilidade = useRecurso<EventoDeRastreabilidade[]>(bolsaSelecionada ? `/bolsas/${bolsaSelecionada.id}/rastreabilidade` : null)
  const bolsasVisiveis = (bolsas.dados?.content ?? []).filter((bolsa) =>
    `${bolsa.codigo} ${bolsa.tipoSanguineo} ${bolsa.unidadeAtualNome} ${bolsa.componente}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')),
  )

  return (
    <>
      <Cabecalho
        titulo="Estoque"
        descricao="Posição por unidade, tipo e componente, e as bolsas na ordem de chegada"
      />

      <div className="pagina">
        <AvisoAcademico />

        <Cartao titulo="Filtros">
          <div className="filtros-linha">
            <label className="campo campo--busca">
              <span className="campo__rotulo">Buscar nesta página</span>
              <input type="search" value={busca} placeholder="Código, tipo ou unidade" onChange={(evento) => {
                const proxima = new URLSearchParams(parametros)
                if (evento.target.value) proxima.set('busca', evento.target.value)
                else proxima.delete('busca')
                definirParametros(proxima)
              }} />
            </label>
            <label className="campo">
              <span className="campo__rotulo">Hemocentro</span>
              <select value={unidadeId} onChange={(evento) => { setUnidadeId(evento.target.value); setPagina(0) }}>
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
                onChange={(evento) => { setComponente(evento.target.value as TipoComponente | ''); setPagina(0) }}
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
                onChange={(evento) => { setSomenteDisponiveis(evento.target.value === 'disponiveis'); setPagina(0) }}
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
            vazio={!busca && bolsasVisiveis.length === 0}
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
                    <th>Histórico</th>
                  </tr>
                </thead>
                <tbody>
                  {bolsasVisiveis.map((bolsa) => (
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
                      <td><button className="botao botao--secundario" type="button" onClick={() => setBolsaSelecionada(bolsa)}>Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {busca && bolsasVisiveis.length === 0 && <p className="texto-vazio">Nenhuma bolsa nesta página corresponde à busca. Tente outra página ou ajuste os filtros.</p>}

            <div className="paginacao">
              <span>Página {(bolsas.dados?.number ?? 0) + 1} de {bolsas.dados?.totalPages ?? 1} · {bolsas.dados?.totalElements ?? 0} bolsa(s) no total</span>
              <div className="paginacao__botoes">
                <button className="botao botao--secundario" type="button" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                <button className="botao botao--secundario" type="button" disabled={pagina + 1 >= (bolsas.dados?.totalPages ?? 1)} onClick={() => setPagina(pagina + 1)}>Próxima</button>
              </div>
            </div>
            <div className="rodape-tabela">A busca filtra apenas as bolsas desta página. A ordem de chegada não representa prioridade por validade.</div>
          </Estado>
        </Cartao>

        {bolsaSelecionada && <Cartao titulo={`Rastreabilidade · ${bolsaSelecionada.codigo}`}
          acoes={<button type="button" className="botao botao--secundario" onClick={() => setBolsaSelecionada(null)}>Fechar</button>}>
          <Estado carregando={rastreabilidade.carregando} erro={rastreabilidade.erro}
            vazio={(rastreabilidade.dados ?? []).length === 0} mensagemVazio="Nenhum evento registrado para esta bolsa."
            aoTentarNovamente={rastreabilidade.recarregar}>
            <div className="tabela__rolagem"><table className="tabela"><thead><tr><th>Quando</th><th>De</th><th>Para</th><th>Descrição</th></tr></thead><tbody>
              {(rastreabilidade.dados ?? []).map((evento) => <tr key={evento.id}>
                <td>{new Date(evento.ocorridoEm).toLocaleString('pt-BR')}</td><td>{evento.statusAnterior ?? '—'}</td><td>{evento.statusNovo}</td><td>{evento.descricao ?? '—'}</td>
              </tr>)}
            </tbody></table></div>
          </Estado>
        </Cartao>}
      </div>
    </>
  )
}
