import { useState, type FormEvent } from 'react'
import { ErroDaApi, api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Etiqueta } from '../componentes/Etiqueta'
import { Icone } from '../componentes/Icone'
import { Cabecalho } from '../componentes/Layout'
import type { Entrega, Pagina, Requisicao, StatusEntrega, Unidade, Veiculo } from '../tipos/api'

const estados: { valor: StatusEntrega | ''; rotulo: string }[] = [
  { valor: '', rotulo: 'Todas as situações' },
  { valor: 'PLANEJADA', rotulo: 'Planejadas' },
  { valor: 'DESPACHADA', rotulo: 'Despachadas' },
  { valor: 'EM_TRANSPORTE', rotulo: 'Em transporte' },
  { valor: 'ENTREGUE', rotulo: 'Entregues' },
  { valor: 'CANCELADA', rotulo: 'Canceladas' },
]

function tom(status: StatusEntrega) {
  if (status === 'ENTREGUE') return 'sucesso'
  if (status === 'CANCELADA') return 'erro'
  if (status === 'EM_TRANSPORTE' || status === 'DESPACHADA') return 'atencao'
  return 'neutro'
}

export function PaginaDeEntregas() {
  const [filtro, setFiltro] = useState<StatusEntrega | ''>('')
  const entregas = useRecurso<Entrega[]>(`/entregas${filtro ? `?status=${filtro}` : ''}`)
  const requisicoes = useRecurso<Pagina<Requisicao>>('/requisicoes?size=50')
  const veiculos = useRecurso<Veiculo[]>('/veiculos')
  const origens = useRecurso<Unidade[]>('/hemocentros')
  const [requisicaoId, setRequisicaoId] = useState('')
  const [veiculoId, setVeiculoId] = useState('')
  const [origemId, setOrigemId] = useState('')
  const [rota, setRota] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [acaoEmCurso, setAcaoEmCurso] = useState<number | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const aptas = (requisicoes.dados?.content ?? []).filter((item) => item.status === 'ALOCADA')

  async function planejar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null); setMensagem(null); setSalvando(true)
    try {
      await api.enviar('/entregas', {
        requisicaoId: Number(requisicaoId), veiculoId: Number(veiculoId), origemId: Number(origemId),
        rota: rota.trim() || null,
      })
      setMensagem('Entrega planejada e salva no backend.')
      setRequisicaoId(''); setVeiculoId(''); setOrigemId(''); setRota('')
      entregas.recarregar(); requisicoes.recarregar(); veiculos.recarregar()
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível planejar a entrega.')
    } finally { setSalvando(false) }
  }

  async function avançar(entrega: Entrega) {
    const etapa = entrega.status === 'PLANEJADA' ? 'despacho' : entrega.status === 'DESPACHADA' ? 'inicio-transporte' : 'conclusao'
    setErro(null); setMensagem(null); setAcaoEmCurso(entrega.id)
    try {
      await api.enviar(`/entregas/${entrega.id}/${etapa}`)
      setMensagem(`Entrega da requisição ${entrega.requisicaoCodigo} atualizada.`)
      entregas.recarregar(); requisicoes.recarregar(); veiculos.recarregar()
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível atualizar a entrega.')
    } finally { setAcaoEmCurso(null) }
  }

  return <>
    <Cabecalho titulo="Entregas" descricao="Planejamento e acompanhamento das entregas registradas na API" />
    <div className="pagina">
      <AvisoAcademico />
      <div className="painel-nota"><Icone nome="caminhao" /><p>A rota abaixo é o texto planejado para cada entrega. O backend ainda não fornece geometria ou posições em tempo real para desenhar um mapa confiável.</p></div>
      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
      {mensagem && <div className="aviso aviso--info" role="status">{mensagem}</div>}

      <Cartao titulo="Planejar entrega" ajuda="Disponível para requisições com bolsas já alocadas">
        <Estado carregando={requisicoes.carregando || veiculos.carregando || origens.carregando}
          erro={requisicoes.erro ?? veiculos.erro ?? origens.erro}
          aoTentarNovamente={() => { requisicoes.recarregar(); veiculos.recarregar(); origens.recarregar() }}>
          <form onSubmit={planejar}>
            <div className="formulario">
              <label className="campo"><span className="campo__rotulo">Requisição alocada</span><select required value={requisicaoId} onChange={(e) => setRequisicaoId(e.target.value)}><option value="">Selecione…</option>{aptas.map((item) => <option value={item.id} key={item.id}>{item.codigo} · {item.hospitalNome}</option>)}</select></label>
              <label className="campo"><span className="campo__rotulo">Veículo</span><select required value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}><option value="">Selecione…</option>{(veiculos.dados ?? []).map((item) => <option value={item.id} key={item.id}>{item.placa} · {item.status}</option>)}</select></label>
              <label className="campo"><span className="campo__rotulo">Hemocentro de origem</span><select required value={origemId} onChange={(e) => setOrigemId(e.target.value)}><option value="">Selecione…</option>{(origens.dados ?? []).map((item) => <option value={item.id} key={item.id}>{item.nome}</option>)}</select></label>
              <label className="campo"><span className="campo__rotulo">Descrição da rota (opcional)</span><input value={rota} onChange={(e) => setRota(e.target.value)} placeholder="Ex.: Hemocentro Recife → Hospital Central" /></label>
            </div>
            {aptas.length === 0 && <p className="texto-vazio">Nenhuma requisição alocada. Crie e processe uma requisição antes de planejar a entrega.</p>}
            <button className="botao botao--primario" type="submit" disabled={salvando || aptas.length === 0} style={{ marginTop: 18 }}>{salvando ? 'Salvando…' : 'Planejar entrega'}</button>
          </form>
        </Estado>
      </Cartao>

      <Cartao titulo="Acompanhamento" ajuda="Situação atual conforme o backend" acoes={<select aria-label="Filtrar entregas por situação" value={filtro} onChange={(e) => setFiltro(e.target.value as StatusEntrega | '')}>{estados.map((item) => <option key={item.valor} value={item.valor}>{item.rotulo}</option>)}</select>}>
        <Estado carregando={entregas.carregando} erro={entregas.erro} vazio={(entregas.dados ?? []).length === 0}
          mensagemVazio="Nenhuma entrega encontrada para este filtro." aoTentarNovamente={entregas.recarregar}>
          <div className="tabela__rolagem"><table className="tabela"><thead><tr><th>Requisição</th><th>Origem</th><th>Veículo</th><th>Rota planejada</th><th>Situação</th><th>Ação</th></tr></thead><tbody>
            {(entregas.dados ?? []).map((item) => <tr key={item.id}>
              <td><strong>{item.requisicaoCodigo}</strong></td><td>{item.origemNome}</td><td>{item.veiculoPlaca}</td>
              <td>{item.rota || <span className="texto-vazio">Não informada</span>}</td>
              <td><Etiqueta texto={item.status.replace('_', ' ')} tom={tom(item.status)} /></td>
              <td>{item.status !== 'ENTREGUE' && item.status !== 'CANCELADA' && <button type="button" className="botao botao--secundario" disabled={acaoEmCurso === item.id} onClick={() => avançar(item)}>{item.status === 'PLANEJADA' ? 'Despachar' : item.status === 'DESPACHADA' ? 'Iniciar transporte' : 'Concluir'}</button>}</td>
            </tr>)}
          </tbody></table></div>
        </Estado>
      </Cartao>
    </div>
  </>
}
