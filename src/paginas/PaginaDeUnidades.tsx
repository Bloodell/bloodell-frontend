import { useRecurso } from '../api/useRecurso'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Cabecalho } from '../componentes/Layout'
import type { Unidade } from '../tipos/api'

function TabelaDeUnidades({ unidades }: { unidades: Unidade[] }) {
  return (
    <div className="tabela__rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Cidade</th>
            <th>UF</th>
            <th>Coordenada</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map((unidade) => (
            <tr key={unidade.id}>
              <td>{unidade.nome}</td>
              <td>{unidade.cidade}</td>
              <td>{unidade.uf}</td>
              <td>
                <code>
                  {unidade.latitude.toFixed(4)}, {unidade.longitude.toFixed(4)}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Rede de unidades: hemocentros que armazenam e hospitais que solicitam. */
export function PaginaDeUnidades() {
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const hospitais = useRecurso<Unidade[]>('/hospitais')

  return (
    <>
      <Cabecalho titulo="Unidades" descricao="Hemocentros e hospitais da rede sintética" />

      <div className="pagina">
        <Cartao titulo="Hemocentros" ajuda="Recebem doações, armazenam bolsas e despacham entregas">
          <Estado
            carregando={hemocentros.carregando}
            erro={hemocentros.erro}
            vazio={(hemocentros.dados ?? []).length === 0}
            mensagemVazio="Nenhum hemocentro cadastrado. Crie o cenário de demonstração no painel."
            aoTentarNovamente={hemocentros.recarregar}
          >
            <TabelaDeUnidades unidades={hemocentros.dados ?? []} />
          </Estado>
        </Cartao>

        <Cartao titulo="Hospitais" ajuda="Solicitam hemocomponentes e recebem as entregas">
          <Estado
            carregando={hospitais.carregando}
            erro={hospitais.erro}
            vazio={(hospitais.dados ?? []).length === 0}
            mensagemVazio="Nenhum hospital cadastrado ainda."
            aoTentarNovamente={hospitais.recarregar}
          >
            <TabelaDeUnidades unidades={hospitais.dados ?? []} />
          </Estado>
        </Cartao>

        <Cartao titulo="Coordenadas e rotas">
          <p style={{ margin: 0, color: 'var(--texto-suave)' }}>
            As coordenadas já estão no cadastro porque a roteirização da Unidade 2 vai
            precisar delas. Cálculo de rota pelo vizinho mais próximo{' '}
            <strong>ainda não existe</strong> no sistema — não há mapa nem sequência de
            paradas nesta etapa.
          </p>
        </Cartao>
      </div>
    </>
  )
}
