import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { ErroDaApi, api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
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
  const [tipo, setTipo] = useState<'hemocentros' | 'hospitais'>('hemocentros')
  const [nome, setNome] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function cadastrar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null); setMensagem(null); setSalvando(true)
    try {
      await api.enviar(`/${tipo}`, {
        nome: nome.trim(), cidade: cidade.trim(), uf: uf.trim().toUpperCase(),
        latitude: Number(latitude), longitude: Number(longitude),
      })
      setMensagem(`${tipo === 'hemocentros' ? 'Hemocentro' : 'Hospital'} cadastrado no backend.`)
      setNome(''); setCidade(''); setUf(''); setLatitude(''); setLongitude('')
      hemocentros.recarregar(); hospitais.recarregar()
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível cadastrar a unidade.')
    } finally { setSalvando(false) }
  }

  return (
    <>
      <Cabecalho titulo="Unidades" descricao="Hemocentros e hospitais da rede sintética" />

      <div className="pagina">
        <AvisoAcademico />
        {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
        {mensagem && <div className="aviso aviso--info" role="status">{mensagem}</div>}

        <Cartao titulo="Cadastrar unidade" ajuda="Use apenas unidades fictícias nesta demonstração">
          <form onSubmit={cadastrar}>
            <div className="formulario">
              <label className="campo"><span className="campo__rotulo">Tipo</span><select value={tipo} onChange={(e) => setTipo(e.target.value as 'hemocentros' | 'hospitais')}><option value="hemocentros">Hemocentro</option><option value="hospitais">Hospital</option></select></label>
              <label className="campo"><span className="campo__rotulo">Nome</span><input required maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome fictício da unidade" /></label>
              <label className="campo"><span className="campo__rotulo">Cidade</span><input required value={cidade} onChange={(e) => setCidade(e.target.value)} /></label>
              <label className="campo"><span className="campo__rotulo">UF</span><input required minLength={2} maxLength={2} value={uf} onChange={(e) => setUf(e.target.value)} placeholder="PE" /></label>
              <label className="campo"><span className="campo__rotulo">Latitude</span><input required type="number" step="any" min={-90} max={90} value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-8.0476" /></label>
              <label className="campo"><span className="campo__rotulo">Longitude</span><input required type="number" step="any" min={-180} max={180} value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-34.8770" /></label>
            </div>
            <button className="botao botao--primario" type="submit" disabled={salvando} style={{ marginTop: 18 }}>{salvando ? 'Cadastrando…' : 'Cadastrar unidade'}</button>
          </form>
        </Cartao>

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

        <Cartao titulo="Coordenadas e entregas">
          <p style={{ margin: 0, color: 'var(--texto-suave)' }}>
            As coordenadas ficam registradas para a logística. A API permite planejar
            e acompanhar entregas, mas ainda não fornece geometria para um mapa ou
            cálculo automático de trajeto. <Link to="/entregas">Ver entregas</Link>.
          </p>
        </Cartao>
      </div>
    </>
  )
}
