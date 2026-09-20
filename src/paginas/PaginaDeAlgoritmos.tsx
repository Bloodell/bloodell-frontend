import { useRecurso } from '../api/useRecurso'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Etiqueta } from '../componentes/Etiqueta'
import { tomDaPrioridade, tomDoEstadoDaBolsa } from '../componentes/tons'
import { Cabecalho } from '../componentes/Layout'
import type {
  SituacaoDoModuloAed,
  SnapshotDaFila,
  SnapshotDaLista,
  SnapshotDaPilha,
} from '../tipos/api'

function momentoLegivel(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR')
}

/**
 * Visualizador das estruturas de dados.
 *
 * O que aparece aqui e o retrato de uma execucao real: o backend monta a lista,
 * a fila e a pilha a partir do banco e devolve o conteudo dos nos. Nao ha
 * nenhuma animacao desenhada sobre dado inventado.
 */
export function PaginaDeAlgoritmos() {
  const lista = useRecurso<SnapshotDaLista>('/algoritmos/estoque')
  const fila = useRecurso<SnapshotDaFila>('/algoritmos/fila')
  const pilha = useRecurso<SnapshotDaPilha>('/algoritmos/historico')
  const situacao = useRecurso<SituacaoDoModuloAed>('/algoritmos/situacao')

  function recarregarTudo() {
    lista.recarregar()
    fila.recarregar()
    pilha.recarregar()
  }

  return (
    <>
      <Cabecalho
        titulo="Estruturas de dados (AED)"
        descricao="Lista, fila e pilha implementadas à mão, com os dados que vieram do banco"
        acoes={
          <button type="button" className="botao botao--secundario" onClick={recarregarTudo}>
            Capturar novamente
          </button>
        }
      />

      <div className="pagina">
        <Cartao titulo="O que já existe e o que ainda não existe">
          <Estado carregando={situacao.carregando} erro={situacao.erro} aoTentarNovamente={situacao.recarregar}>
            <div className="grade grade--2">
              <div>
                <h3 style={{ marginBottom: 8 }}>Implementado — Unidade {situacao.dados?.etapaVigente}</h3>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {(situacao.dados?.implementados ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ marginBottom: 8 }}>Ainda não implementado — Unidade 2</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--texto-suave)' }}>
                  {(situacao.dados?.pendentesDaUnidadeDois ?? []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="aviso aviso--academico" style={{ marginTop: 16 }}>
              {situacao.dados?.observacao}
            </div>
          </Estado>
        </Cartao>

        <Cartao
          titulo="Lista encadeada — estoque"
          ajuda={
            lista.dados
              ? `${lista.dados.tamanho} nó(s) · ordem: ${lista.dados.ordem} · capturado às ${momentoLegivel(lista.dados.capturadoEm)}`
              : undefined
          }
        >
          <Estado
            carregando={lista.carregando}
            erro={lista.erro}
            vazio={(lista.dados?.nos ?? []).length === 0}
            mensagemVazio="A lista está vazia: nenhuma bolsa no estoque."
            aoTentarNovamente={lista.recarregar}
          >
            <div className="estrutura">
              {(lista.dados?.nos ?? []).slice(0, 24).map((no, indice, todos) => (
                <div key={no.codigo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="no">
                    <div className="no__codigo">{no.codigo}</div>
                    <div className="no__detalhe">
                      {no.tipoSanguineo} · {no.componente}
                    </div>
                    <div className="no__detalhe">vence {no.dataValidade}</div>
                    <div style={{ marginTop: 4 }}>
                      <Etiqueta texto={no.status} tom={tomDoEstadoDaBolsa(no.status)} />
                    </div>
                  </div>
                  {indice < todos.length - 1 ? (
                    <span className="seta" aria-hidden="true">→</span>
                  ) : (
                    <span className="seta">→ null</span>
                  )}
                </div>
              ))}
            </div>

            {(lista.dados?.nos.length ?? 0) > 24 && (
              <div className="rodape-tabela">
                Mostrando os 24 primeiros nós de {lista.dados?.tamanho}.
              </div>
            )}

            <div className="aviso aviso--academico" style={{ marginTop: 16 }}>
              {lista.dados?.observacao}
            </div>
          </Estado>
        </Cartao>

        <Cartao
          titulo="Fila — requisições"
          ajuda={
            fila.dados
              ? `${fila.dados.tamanho} nó(s) · ${fila.dados.politica} · capturado às ${momentoLegivel(fila.dados.capturadoEm)}`
              : undefined
          }
        >
          <Estado
            carregando={fila.carregando}
            erro={fila.erro}
            vazio={(fila.dados?.nos ?? []).length === 0}
            mensagemVazio="A fila está vazia: nenhuma requisição aguardando."
            aoTentarNovamente={fila.recarregar}
          >
            <div className="estrutura">
              {(fila.dados?.nos ?? []).map((no, indice, todos) => (
                <div key={no.codigo} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    className={`no${
                      no.prioridade === 'EMERGENCIA'
                        ? ' no--urgente'
                        : no.prioridade === 'URGENTE'
                          ? ' no--atencao'
                          : ''
                    }`}
                  >
                    <div className="no__codigo">{no.codigo}</div>
                    <div className="no__detalhe">{no.hospital}</div>
                    <div style={{ marginTop: 4 }}>
                      <Etiqueta texto={no.prioridade} tom={tomDaPrioridade(no.prioridade)} />
                    </div>
                  </div>
                  {indice < todos.length - 1 ? (
                    <span className="seta" aria-hidden="true">→</span>
                  ) : (
                    <span className="seta">→ null</span>
                  )}
                </div>
              ))}
            </div>

            <div className="aviso aviso--academico" style={{ marginTop: 16 }}>
              {fila.dados?.observacao}
            </div>
          </Estado>
        </Cartao>

        <Cartao
          titulo="Pilha — histórico"
          ajuda={
            pilha.dados
              ? `${pilha.dados.tamanho} nó(s) · ${pilha.dados.ordem} · capturado às ${momentoLegivel(pilha.dados.capturadoEm)}`
              : undefined
          }
        >
          <Estado
            carregando={pilha.carregando}
            erro={pilha.erro}
            vazio={(pilha.dados?.nos ?? []).length === 0}
            mensagemVazio="A pilha está vazia: nenhum evento registrado."
            aoTentarNovamente={pilha.recarregar}
          >
            <div className="estrutura estrutura--pilha">
              {(pilha.dados?.nos ?? []).slice(0, 12).map((no) => (
                <div className="no" key={`${no.codigoBolsa}-${no.posicaoDoTopo}`} style={{ width: 280 }}>
                  <div className="no__codigo">
                    {no.posicaoDoTopo === 1 ? 'topo · ' : ''}
                    {no.codigoBolsa}
                  </div>
                  <div className="no__detalhe">
                    {no.statusAnterior ?? '—'} → {no.statusNovo}
                  </div>
                  <div className="no__detalhe">{momentoLegivel(no.ocorridoEm)}</div>
                </div>
              ))}
            </div>

            <div className="aviso aviso--academico" style={{ marginTop: 16 }}>
              {pilha.dados?.observacao}
            </div>
          </Estado>
        </Cartao>
      </div>
    </>
  )
}
