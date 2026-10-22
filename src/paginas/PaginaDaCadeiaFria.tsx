import { useState, type FormEvent } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ErroDaApi, api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Etiqueta } from '../componentes/Etiqueta'
import { Cabecalho } from '../componentes/Layout'
import type { Alerta, LeituraDeTelemetria, MetricasDeTelemetria, Unidade, Veiculo } from '../tipos/api'

export function PaginaDaCadeiaFria() {
  const veiculos = useRecurso<Veiculo[]>('/veiculos')
  const alertas = useRecurso<Alerta[]>('/alertas')
  const metricas = useRecurso<MetricasDeTelemetria>('/telemetrias/metricas')
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const [veiculoId, setVeiculoId] = useState('')
  const leituras = useRecurso<LeituraDeTelemetria[]>(veiculoId ? `/veiculos/${veiculoId}/telemetrias` : null)
  const [placa, setPlaca] = useState('')
  const [hemocentroId, setHemocentroId] = useState('')
  const [capacidade, setCapacidade] = useState('20')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function cadastrarVeiculo(evento: FormEvent) {
    evento.preventDefault()
    const origem = hemocentros.dados?.find((item) => item.id === Number(hemocentroId))
    if (!origem) { setErro('Selecione um hemocentro para localizar o veículo.'); return }
    setErro(null); setMensagem(null); setSalvando(true)
    try {
      await api.enviar('/veiculos', {
        placa: placa.trim().toUpperCase(), hemocentroBaseId: origem.id,
        capacidadeBolsas: Number(capacidade), latitude: origem.latitude, longitude: origem.longitude,
      })
      setMensagem('Veículo cadastrado na frota. A posição inicial é a do hemocentro selecionado.')
      setPlaca(''); setHemocentroId(''); veiculos.recarregar()
    } catch (falha) {
      setErro(falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível cadastrar o veículo.')
    } finally { setSalvando(false) }
  }

  const pontos = (leituras.dados ?? []).slice(-30).map((item) => ({
    horario: new Date(item.registradaEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    temperatura: Number(item.temperaturaC),
  }))

  return <>
    <Cabecalho titulo="Cadeia fria" descricao="Alertas, frota e temperaturas recebidas do backend" />
    <div className="pagina">
      <AvisoAcademico complemento="As faixas de temperatura são didáticas." />
      {erro && <div className="aviso aviso--erro" role="alert">{erro}</div>}
      {mensagem && <div className="aviso aviso--info" role="status">{mensagem}</div>}

      <div className="resumo-grade resumo-grade--duplo">
        <div className="resumo"><div className="resumo__texto"><span className="resumo__rotulo">Alertas ativos</span><strong className="resumo__valor">{alertas.carregando ? '…' : alertas.dados?.length ?? '—'}</strong><span className="resumo__ajuda">Cadeia fria e operação</span></div></div>
        <div className="resumo"><div className="resumo__texto"><span className="resumo__rotulo">Leituras persistidas</span><strong className="resumo__valor">{metricas.carregando ? '…' : metricas.dados?.leiturasPersistidas ?? '—'}</strong><span className="resumo__ajuda">Telemetria recebida pela API</span></div></div>
      </div>

      <div className="painel-grade">
        <Cartao titulo="Temperatura por veículo" ajuda="Últimas 30 leituras do veículo selecionado"
          acoes={<select aria-label="Selecionar veículo" value={veiculoId} onChange={(e) => setVeiculoId(e.target.value)}><option value="">Selecione um veículo</option>{(veiculos.dados ?? []).map((item) => <option key={item.id} value={item.id}>{item.placa}</option>)}</select>}>
          <Estado carregando={veiculos.carregando || leituras.carregando} erro={veiculos.erro ?? leituras.erro}
            aoTentarNovamente={() => { veiculos.recarregar(); leituras.recarregar() }}>
            {veiculoId && pontos.length ? <ResponsiveContainer width="100%" height={260}>
              <LineChart data={pontos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e8efea" strokeDasharray="3 3" />
                <XAxis dataKey="horario" tick={{ fontSize: 11 }} /><YAxis unit="°C" tick={{ fontSize: 11 }} />
                <Tooltip /><Line dataKey="temperatura" name="Temperatura" unit="°C" type="monotone" stroke="#0f7047" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer> : <div className="painel-vazio">{veiculoId ? 'Este veículo ainda não tem leituras registradas.' : 'Selecione um veículo para consultar o histórico.'}</div>}
          </Estado>
        </Cartao>
        <Cartao titulo="Alertas ativos" ajuda="Ocorrências reais calculadas pelo backend">
          <Estado carregando={alertas.carregando} erro={alertas.erro} vazio={(alertas.dados ?? []).length === 0}
            mensagemVazio="Nenhum alerta ativo no momento." aoTentarNovamente={alertas.recarregar}>
            <div className="lista-alertas">{(alertas.dados ?? []).map((item) => <div key={item.id} className="lista-alertas__item"><Etiqueta texto={item.nivel} tom={item.nivel === 'CRITICO' ? 'erro' : 'atencao'} /><div><strong>{item.tipo.replaceAll('_', ' ')}</strong><p>{item.mensagem}</p><small>{new Date(item.criadoEm).toLocaleString('pt-BR')}</small></div></div>)}</div>
          </Estado>
        </Cartao>
      </div>

      <Cartao titulo="Frota" ajuda="Veículos cadastrados e posição mais recente conhecida">
        <Estado carregando={veiculos.carregando} erro={veiculos.erro} vazio={(veiculos.dados ?? []).length === 0}
          mensagemVazio="Nenhum veículo cadastrado ainda." aoTentarNovamente={veiculos.recarregar}>
          <div className="tabela__rolagem"><table className="tabela"><thead><tr><th>Placa</th><th>Base</th><th>Capacidade</th><th>Situação</th><th>Coordenadas</th></tr></thead><tbody>{(veiculos.dados ?? []).map((item) => <tr key={item.id}><td><strong>{item.placa}</strong></td><td>{item.hemocentroBaseNome}</td><td>{item.capacidadeBolsas} bolsas</td><td><Etiqueta texto={item.status} tom={item.status === 'DISPONIVEL' ? 'sucesso' : 'atencao'} /></td><td>{item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</td></tr>)}</tbody></table></div>
        </Estado>
      </Cartao>

      <Cartao titulo="Cadastrar veículo" ajuda="A posição inicial será a coordenada do hemocentro de base">
        <Estado carregando={hemocentros.carregando} erro={hemocentros.erro} aoTentarNovamente={hemocentros.recarregar}>
          <form onSubmit={cadastrarVeiculo}><div className="formulario">
            <label className="campo"><span className="campo__rotulo">Placa</span><input required maxLength={10} value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC1D23" /></label>
            <label className="campo"><span className="campo__rotulo">Hemocentro de base</span><select required value={hemocentroId} onChange={(e) => setHemocentroId(e.target.value)}><option value="">Selecione…</option>{(hemocentros.dados ?? []).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
            <label className="campo"><span className="campo__rotulo">Capacidade de bolsas</span><input required type="number" min={1} value={capacidade} onChange={(e) => setCapacidade(e.target.value)} /></label>
          </div><button className="botao botao--primario" type="submit" disabled={salvando} style={{ marginTop: 18 }}>{salvando ? 'Cadastrando…' : 'Cadastrar veículo'}</button></form>
        </Estado>
      </Cartao>
    </div>
  </>
}
