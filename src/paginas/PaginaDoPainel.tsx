import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao, Indicador } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Cabecalho } from '../componentes/Layout'
import type {
  IndicadorDeDemanda,
  IndicadorDeEstoque,
  IndicadorDeTempos,
} from '../tipos/api'
import { useState } from 'react'

const VERDE = '#0f5132'
const VERDE_CLARO = '#22c55e'
const VERMELHO = '#dc2626'

/**
 * Painel descritivo (Estatistica, Unidade 1).
 *
 * Todos os numeros vem de /api/v1/indicadores/*, calculados sobre as tabelas do
 * proprio sistema. Nenhum valor e digitado na tela.
 */
export function PaginaDoPainel() {
  const estoque = useRecurso<IndicadorDeEstoque>('/indicadores/estoque')
  const demanda = useRecurso<IndicadorDeDemanda>('/indicadores/demanda')
  const tempos = useRecurso<IndicadorDeTempos>('/indicadores/tempos')

  const [criandoCenario, setCriandoCenario] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function criarCenarioDeDemonstracao() {
    setCriandoCenario(true)
    setMensagem(null)
    try {
      await api.enviar('/demonstracoes/cenarios', { cenario: 'aula', semente: 42 })
      setMensagem('Cenário sintético criado com a semente 42.')
      estoque.recarregar()
      demanda.recarregar()
      tempos.recarregar()
    } catch (falha) {
      setMensagem(falha instanceof Error ? falha.message : 'Não foi possível criar o cenário.')
    } finally {
      setCriandoCenario(false)
    }
  }

  const semDados = (estoque.dados?.totalDeBolsasDisponiveis ?? 0) === 0

  return (
    <>
      <Cabecalho
        titulo="Painel"
        descricao="Indicadores descritivos calculados sobre os dados do próprio sistema"
        acoes={
          <button
            type="button"
            className="botao botao--secundario"
            onClick={criarCenarioDeDemonstracao}
            disabled={criandoCenario}
          >
            {criandoCenario ? 'Criando…' : 'Criar cenário de demonstração'}
          </button>
        }
      />

      <div className="pagina">
        <AvisoAcademico />

        {mensagem && <div className="aviso aviso--info">{mensagem}</div>}

        <Estado
          carregando={estoque.carregando || demanda.carregando || tempos.carregando}
          erro={estoque.erro ?? demanda.erro ?? tempos.erro}
          aoTentarNovamente={() => {
            estoque.recarregar()
            demanda.recarregar()
            tempos.recarregar()
          }}
        >
          {semDados ? (
            <Cartao titulo="Banco ainda vazio">
              <p style={{ marginTop: 0 }}>
                Nenhuma bolsa disponível no estoque. Use o botão{' '}
                <strong>Criar cenário de demonstração</strong> acima para popular o
                sistema com dados sintéticos reproduzíveis (semente 42), ou registre
                uma doação na tela correspondente.
              </p>
            </Cartao>
          ) : (
            <>
              <div className="grade grade--3">
                <Indicador
                  valor={estoque.dados?.totalDeBolsasDisponiveis ?? 0}
                  rotulo="Bolsas disponíveis no estoque"
                />
                <Indicador
                  valor={demanda.dados?.totalDeRequisicoes ?? 0}
                  rotulo="Requisições registradas"
                />
                <Indicador
                  valor={tempos.dados?.requisicoesNaFila ?? 0}
                  rotulo="Requisições aguardando na fila"
                />
              </div>

              <div className="grade grade--2">
                <Cartao
                  titulo="Estoque por tipo sanguíneo"
                  ajuda="Bolsas com status DISPONÍVEL, agrupadas por tipo"
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={estoque.dados?.porTipoSanguineo ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4ebe8" vertical={false} />
                      <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="quantidade" name="Bolsas" radius={[4, 4, 0, 0]}>
                        {(estoque.dados?.porTipoSanguineo ?? []).map((item) => (
                          <Cell
                            key={item.categoria}
                            // Tipos negativos são os mais escassos na prática:
                            // destacá-los ajuda o operador a ver o risco.
                            fill={item.categoria.endsWith('-') ? VERMELHO : VERDE}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="rodape-tabela">
                    Média por tipo: {estoque.dados?.distribuicaoPorTipo.media ?? 0} ·
                    mediana: {estoque.dados?.distribuicaoPorTipo.mediana ?? 0} ·
                    desvio padrão: {estoque.dados?.distribuicaoPorTipo.desvioPadraoAmostral ?? 0} ·
                    coeficiente de variação: {estoque.dados?.distribuicaoPorTipo.coeficienteDeVariacao ?? 0}%
                  </div>
                </Cartao>

                <Cartao
                  titulo="Demanda por hospital"
                  ajuda="Quantidade de requisições criadas por cada hospital"
                >
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={demanda.dados?.porHospital ?? []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4ebe8" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="categoria"
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="quantidade"
                        name="Requisições"
                        fill={VERDE_CLARO}
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="rodape-tabela">
                    Coeficiente de variação entre hospitais:{' '}
                    {demanda.dados?.distribuicaoPorHospital.coeficienteDeVariacao ?? 0}% — quanto
                    maior, mais desigual é a distribuição da demanda.
                  </div>
                </Cartao>
              </div>

              <Cartao
                titulo="Tempo até o atendimento"
                ajuda="Da criação da requisição até ela ficar atendida"
              >
                {tempos.dados && tempos.dados.requisicoesAtendidas > 0 ? (
                  <div className="grade grade--3">
                    <Indicador
                      valor={`${tempos.dados.tempoAteAtendimento.media} min`}
                      rotulo="Média"
                    />
                    <Indicador
                      valor={`${tempos.dados.tempoAteAtendimento.mediana} min`}
                      rotulo="Mediana"
                    />
                    <Indicador
                      valor={`${tempos.dados.tempoAteAtendimento.desvioPadraoAmostral} min`}
                      rotulo="Desvio padrão amostral"
                    />
                  </div>
                ) : (
                  <p style={{ margin: 0, color: 'var(--texto-suave)' }}>
                    Nenhuma requisição foi atendida até o fim ainda, então não há tempo
                    para medir. Processe uma requisição na tela de requisições para
                    começar a acumular dados.
                  </p>
                )}
              </Cartao>
            </>
          )}
        </Estado>
      </div>
    </>
  )
}
