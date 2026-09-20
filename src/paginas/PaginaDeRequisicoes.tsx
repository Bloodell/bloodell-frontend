import { useState } from 'react'

import { ErroDaApi, api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico, AvisoProvisorioU1 } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Etiqueta } from '../componentes/Etiqueta'
import { tomDaPrioridade, tomDoStatusDaRequisicao } from '../componentes/tons'
import { Cabecalho } from '../componentes/Layout'
import type {
  ItemDaFila,
  Pagina,
  Prioridade,
  Requisicao,
  ResultadoDaAlocacao,
  TipoComponente,
  Unidade,
} from '../tipos/api'

const TIPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const PRIORIDADES: Prioridade[] = ['EMERGENCIA', 'URGENTE', 'ELETIVA']

/**
 * UC3, UC4 e UC5: criar requisicao, ver a fila e processar a alocacao.
 *
 * A ordem da fila mostrada aqui e produzida pela estrutura de dados da AED no
 * backend, nao por uma ordenacao do SQL nem do JavaScript.
 */
export function PaginaDeRequisicoes() {
  const hospitais = useRecurso<Unidade[]>('/hospitais')
  const fila = useRecurso<ItemDaFila[]>('/requisicoes/fila')
  const requisicoes = useRecurso<Pagina<Requisicao>>('/requisicoes?size=50')

  const [hospitalId, setHospitalId] = useState('')
  const [prioridade, setPrioridade] = useState<Prioridade>('URGENTE')
  const [componente, setComponente] = useState<TipoComponente>('CONCENTRADO_HEMACIAS')
  const [tipoSanguineo, setTipoSanguineo] = useState('O+')
  const [quantidade, setQuantidade] = useState('1')

  const [enviando, setEnviando] = useState(false)
  const [erroDoFormulario, setErroDoFormulario] = useState<string | null>(null)

  const [processando, setProcessando] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoDaAlocacao | null>(null)
  const [erroDaAlocacao, setErroDaAlocacao] = useState<string | null>(null)

  function recarregarTudo() {
    fila.recarregar()
    requisicoes.recarregar()
  }

  async function criar(evento: React.FormEvent) {
    evento.preventDefault()
    setErroDoFormulario(null)

    if (!hospitalId) {
      setErroDoFormulario('Escolha o hospital solicitante.')
      return
    }

    setEnviando(true)
    try {
      await api.enviar('/requisicoes', {
        hospitalId: Number(hospitalId),
        prioridade,
        itens: [{ componente, tipoSanguineo, quantidade: Number(quantidade) }],
      })
      recarregarTudo()
    } catch (falha) {
      setErroDoFormulario(
        falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível criar a requisição.',
      )
    } finally {
      setEnviando(false)
    }
  }

  async function processar(requisicaoId: number) {
    setProcessando(requisicaoId)
    setResultado(null)
    setErroDaAlocacao(null)
    try {
      const resposta = await api.enviar<ResultadoDaAlocacao>(
        `/requisicoes/${requisicaoId}/alocacoes`,
      )
      setResultado(resposta)
      recarregarTudo()
    } catch (falha) {
      setErroDaAlocacao(
        falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível processar a requisição.',
      )
      recarregarTudo()
    } finally {
      setProcessando(null)
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Requisições"
        descricao="Pedidos hospitalares, fila de atendimento e alocação de bolsas"
        acoes={
          <button type="button" className="botao botao--secundario" onClick={recarregarTudo}>
            Atualizar
          </button>
        }
      />

      <div className="pagina">
        <AvisoAcademico />

        <Cartao titulo="Nova requisição">
          <Estado carregando={hospitais.carregando} erro={hospitais.erro} aoTentarNovamente={hospitais.recarregar}>
            <form onSubmit={criar}>
              <div className="formulario">
                <label className="campo">
                  <span className="campo__rotulo">Hospital</span>
                  <select value={hospitalId} onChange={(evento) => setHospitalId(evento.target.value)} required>
                    <option value="">Selecione…</option>
                    {(hospitais.dados ?? []).map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="campo">
                  <span className="campo__rotulo">Prioridade</span>
                  <select
                    value={prioridade}
                    onChange={(evento) => setPrioridade(evento.target.value as Prioridade)}
                  >
                    {PRIORIDADES.map((valor) => (
                      <option key={valor} value={valor}>
                        {valor}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="campo">
                  <span className="campo__rotulo">Componente</span>
                  <select
                    value={componente}
                    onChange={(evento) => setComponente(evento.target.value as TipoComponente)}
                  >
                    <option value="CONCENTRADO_HEMACIAS">Concentrado de hemácias</option>
                    <option value="PLASMA">Plasma</option>
                    <option value="PLAQUETAS">Plaquetas</option>
                  </select>
                </label>

                <label className="campo">
                  <span className="campo__rotulo">Tipo sanguíneo</span>
                  <select value={tipoSanguineo} onChange={(evento) => setTipoSanguineo(evento.target.value)}>
                    {TIPOS.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="campo">
                  <span className="campo__rotulo">Quantidade</span>
                  <input
                    type="number"
                    min={1}
                    value={quantidade}
                    onChange={(evento) => setQuantidade(evento.target.value)}
                  />
                </label>

                <button type="submit" className="botao botao--primario" disabled={enviando}>
                  {enviando ? 'Criando…' : 'Criar requisição'}
                </button>
              </div>

              {erroDoFormulario && (
                <div className="aviso aviso--erro" role="alert" style={{ marginTop: 16 }}>
                  {erroDoFormulario}
                </div>
              )}
            </form>
          </Estado>
        </Cartao>

        <Cartao
          titulo="Fila de atendimento"
          ajuda="Ordem produzida pela estrutura de fila da AED: prioridade e, dentro dela, chegada"
        >
          <Estado
            carregando={fila.carregando}
            erro={fila.erro}
            vazio={(fila.dados ?? []).length === 0}
            mensagemVazio="Nenhuma requisição aguardando atendimento."
            aoTentarNovamente={fila.recarregar}
          >
            <div className="estrutura">
              {(fila.dados ?? []).map((item, indice) => (
                <div key={item.codigo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className={`no${
                      item.prioridade === 'EMERGENCIA'
                        ? ' no--urgente'
                        : item.prioridade === 'URGENTE'
                          ? ' no--atencao'
                          : ''
                    }`}
                  >
                    <div className="no__codigo">
                      {item.posicao}º · {item.codigo}
                    </div>
                    <div className="no__detalhe">{item.hospital}</div>
                    <div style={{ marginTop: 4 }}>
                      <Etiqueta texto={item.prioridade} tom={tomDaPrioridade(item.prioridade)} />
                    </div>
                  </div>
                  {indice < (fila.dados ?? []).length - 1 && <span className="seta">→</span>}
                </div>
              ))}
            </div>
          </Estado>
        </Cartao>

        {(resultado || erroDaAlocacao) && (
          <Cartao titulo="Resultado do processamento">
            {erroDaAlocacao && (
              <div className="aviso aviso--erro" role="alert">
                {erroDaAlocacao}
              </div>
            )}

            {resultado && (
              <>
                <AvisoProvisorioU1 texto={resultado.avisoAcademico} />

                <p style={{ marginBottom: 8 }}>
                  Requisição <strong>{resultado.requisicaoCodigo}</strong> ·{' '}
                  {resultado.quantidadeAlocada} de {resultado.quantidadeSolicitada} bolsa(s)
                  alocada(s) · política <code>{resultado.politicaAplicada}</code>
                </p>

                <div className="tabela__rolagem">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Etapa</th>
                        <th>O que o sistema fez</th>
                        <th>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.passos.map((passo) => (
                        <tr key={passo.ordem}>
                          <td>{passo.ordem}</td>
                          <td><strong>{passo.etapa}</strong></td>
                          <td>{passo.detalhe}</td>
                          <td>{passo.resultado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rodape-tabela">
                  Cada linha acima é um passo que o algoritmo realmente executou — não é
                  texto escrito para a tela.
                </div>
              </>
            )}
          </Cartao>
        )}

        <Cartao titulo="Todas as requisições">
          <Estado
            carregando={requisicoes.carregando}
            erro={requisicoes.erro}
            vazio={(requisicoes.dados?.content ?? []).length === 0}
            mensagemVazio="Nenhuma requisição registrada ainda."
            aoTentarNovamente={requisicoes.recarregar}
          >
            <div className="tabela__rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Hospital</th>
                    <th>Prioridade</th>
                    <th>Itens</th>
                    <th>Situação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {(requisicoes.dados?.content ?? []).map((requisicao) => (
                    <tr key={requisicao.id}>
                      <td><code>{requisicao.codigo}</code></td>
                      <td>{requisicao.hospitalNome}</td>
                      <td>
                        <Etiqueta
                          texto={requisicao.prioridade}
                          tom={tomDaPrioridade(requisicao.prioridade)}
                        />
                      </td>
                      <td>
                        {requisicao.itens.map((item) => (
                          <div key={item.id} className="no__detalhe">
                            {item.quantidade}× {item.tipoSanguineo} · {item.componente}
                            {item.quantidadeAlocada > 0 && ` (${item.quantidadeAlocada} alocada)`}
                          </div>
                        ))}
                      </td>
                      <td>
                        <Etiqueta
                          texto={requisicao.status}
                          tom={tomDoStatusDaRequisicao(requisicao.status)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="botao botao--secundario"
                          disabled={requisicao.status !== 'NA_FILA' || processando === requisicao.id}
                          onClick={() => processar(requisicao.id)}
                        >
                          {processando === requisicao.id ? 'Processando…' : 'Processar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Estado>
        </Cartao>
      </div>
    </>
  )
}
