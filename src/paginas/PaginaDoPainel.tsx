import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Icone, Marca, type NomeIcone } from '../componentes/Icone'
import { Cabecalho } from '../componentes/Layout'
import type { Alerta, Entrega, IndicadorDeDemanda, IndicadorDeEstoque, IndicadorDeTempos } from '../tipos/api'

const CORES_PRIORIDADE: Record<string, string> = {
  EMERGENCIA: '#dc2626', URGENTE: '#f08a39', ELETIVA: '#22cc5e',
}

function Resumo({ rotulo, valor, ajuda, icone, tom }: {
  rotulo: string; valor: number | string; ajuda: string; icone: NomeIcone; tom?: string
}) {
  return <div className={`resumo${tom ? ` resumo--${tom}` : ''}`}>
    <div className="resumo__icone"><Icone nome={icone} /></div>
    <div className="resumo__texto">
      <span className="resumo__rotulo">{rotulo}</span>
      <strong className="resumo__valor">{valor}</strong>
      <span className="resumo__ajuda">{ajuda}</span>
    </div>
  </div>
}

export function PaginaDoPainel() {
  const estoque = useRecurso<IndicadorDeEstoque>('/indicadores/estoque')
  const demanda = useRecurso<IndicadorDeDemanda>('/indicadores/demanda')
  const tempos = useRecurso<IndicadorDeTempos>('/indicadores/tempos')
  const entregas = useRecurso<Entrega[]>('/entregas')
  const alertas = useRecurso<Alerta[]>('/alertas')
  const [criando, setCriando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function criarCenario() {
    setCriando(true)
    setMensagem(null)
    try {
      await api.enviar('/demonstracoes/cenarios', { cenario: 'aula', semente: 42 })
      setMensagem('Cenário sintético criado. Indicadores atualizados com dados da API.')
      estoque.recarregar(); demanda.recarregar(); tempos.recarregar()
      entregas.recarregar(); alertas.recarregar()
    } catch (falha) {
      setMensagem(falha instanceof Error ? falha.message : 'Não foi possível criar o cenário. Confira se a demonstração está habilitada no backend.')
    } finally {
      setCriando(false)
    }
  }

  const emRota = (entregas.dados ?? []).filter((item) => item.status === 'DESPACHADA' || item.status === 'EM_TRANSPORTE')
  const tipos = estoque.dados?.porTipoSanguineo ?? []
  const prioridades = demanda.dados?.porPrioridade ?? []
  const semDados = (estoque.dados?.totalDeBolsasDisponiveis ?? 0) === 0 && (demanda.dados?.totalDeRequisicoes ?? 0) === 0

  return <>
    <Cabecalho titulo="Visão geral" descricao="Acompanhe a operação da rede em um só lugar. Todos os números vêm da API."
      acoes={<button type="button" className="botao botao--secundario" onClick={() => {
        estoque.recarregar(); demanda.recarregar(); tempos.recarregar(); entregas.recarregar(); alertas.recarregar()
      }}>Atualizar dados</button>} />
    <div className="pagina">
      <AvisoAcademico />
      <section className="hero-operacao" aria-label="Apresentação Bloodell">
        <div className="hero-operacao__conteudo">
          <span className="hero-operacao__sobretitulo">INTELIGÊNCIA PARA A REDE DE SANGUE</span>
          <h2>Conectando vidas, em cada entrega.</h2>
          <p>Da doação ao atendimento hospitalar, acompanhe as bolsas, os pedidos e a logística em um só lugar.</p>
          <Link to="/estoque" className="hero-operacao__link">Explorar estoque <Icone nome="seta" /></Link>
        </div>
        <div className="hero-operacao__marca" aria-hidden="true"><Marca clara /></div>
      </section>
      {mensagem && <div className="aviso aviso--info" role="status">{mensagem}</div>}
      <Estado carregando={estoque.carregando || demanda.carregando || tempos.carregando}
        erro={estoque.erro ?? demanda.erro ?? tempos.erro}
        aoTentarNovamente={() => { estoque.recarregar(); demanda.recarregar(); tempos.recarregar() }}>
        <div className="resumo-grade">
          <Resumo icone="doacao" tom="vermelho" rotulo="Bolsas disponíveis" valor={estoque.dados?.totalDeBolsasDisponiveis ?? 0} ajuda="Estoque atual" />
          <Resumo icone="requisicoes" tom="laranja" rotulo="Requisições registradas" valor={demanda.dados?.totalDeRequisicoes ?? 0} ajuda={`${tempos.dados?.requisicoesNaFila ?? 0} aguardando na fila`} />
          <Resumo icone="caminhao" rotulo="Entregas em rota" valor={entregas.carregando ? '…' : emRota.length} ajuda={entregas.erro ? 'Consulta indisponível' : 'Despachadas ou em transporte'} />
          <Resumo icone="termometro" tom="azul" rotulo="Alertas ativos" valor={alertas.carregando ? '…' : (alertas.dados?.length ?? '—')} ajuda={alertas.erro ? 'Consulta indisponível' : 'Cadeia fria e operação'} />
        </div>

        {semDados && <div className="painel-nota">
          <Icone nome="alerta" />
          <p>O banco ainda não tem dados para os gráficos. <Link to="/unidades">Cadastre unidades</Link> e registre uma doação para iniciar a operação.
            {import.meta.env.DEV && <button type="button" className="botao botao--secundario" style={{ marginLeft: 12 }} onClick={criarCenario} disabled={criando}>{criando ? 'Criando…' : 'Criar cenário sintético'}</button>}
          </p>
        </div>}

        <div className="painel-grade">
          <Cartao titulo="Estoque por tipo sanguíneo" ajuda="Bolsas disponíveis agrupadas por tipo ABO/Rh">
            {tipos.length ? <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tipos} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8efea" vertical={false} />
                <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: '#64736d' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64736d' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="quantidade" name="Bolsas" radius={[5, 5, 0, 0]} maxBarSize={35}>
                  {tipos.map((item) => <Cell key={item.categoria} fill={item.categoria.endsWith('-') ? '#dc2626' : '#25b965'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer> : <div className="painel-vazio">Sem bolsas disponíveis para exibir.</div>}
            <div className="painel-legenda"><span style={{ '--cor': '#25b965' } as React.CSSProperties}>Tipos positivos</span><span style={{ '--cor': '#dc2626' } as React.CSSProperties}>Tipos negativos</span></div>
          </Cartao>
          <Cartao titulo="Requisições por prioridade" ajuda="Distribuição dos pedidos registrados">
            {prioridades.length ? <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={prioridades} dataKey="quantidade" nameKey="categoria" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {prioridades.map((item) => <Cell key={item.categoria} fill={CORES_PRIORIDADE[item.categoria] ?? '#8aa99a'} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="painel-legenda">{prioridades.map((item) => <span key={item.categoria} style={{ '--cor': CORES_PRIORIDADE[item.categoria] ?? '#8aa99a' } as React.CSSProperties}>{item.categoria.replace('_', ' ')} · {item.quantidade}</span>)}</div>
            </> : <div className="painel-vazio">Sem requisições para exibir.</div>}
          </Cartao>
        </div>

        <div className="painel-grade painel-grade--triplo">
          <Cartao titulo="Entregas em acompanhamento" ajuda="Dados reais do planejamento logístico">
            <Estado carregando={entregas.carregando} erro={entregas.erro} aoTentarNovamente={entregas.recarregar}>
              {emRota.length ? <div className="lista-compacta">{emRota.slice(0, 4).map((item) => <div className="lista-compacta__item" key={item.id}><strong>{item.requisicaoCodigo}</strong><span>{item.veiculoPlaca} · {item.status.replace('_', ' ')}</span></div>)}</div> : <p className="texto-vazio">Nenhuma entrega em rota agora.</p>}
            </Estado>
            <Link className="atalho" to="/entregas">Ver entregas <Icone nome="seta" /></Link>
          </Cartao>
          <Cartao titulo="Tempo de atendimento" ajuda="Medição das requisições concluídas">
            <strong className="valor-destaque">{tempos.dados?.requisicoesAtendidas ? `${tempos.dados.tempoAteAtendimento.media} min` : '—'}</strong>
            <p className="texto-vazio">Média calculada sobre {tempos.dados?.requisicoesAtendidas ?? 0} requisição(ões) atendida(s).</p>
          </Cartao>
          <Cartao titulo="Acesso rápido" ajuda="Fluxos principais da operação">
            <div className="atalhos"><Link className="atalho" to="/doacoes"><Icone nome="doacao" /> Registrar doação</Link><Link className="atalho" to="/requisicoes"><Icone nome="requisicoes" /> Nova requisição</Link><Link className="atalho" to="/estoque"><Icone nome="estoque" /> Consultar estoque</Link></div>
          </Cartao>
        </div>
      </Estado>
    </div>
  </>
}
