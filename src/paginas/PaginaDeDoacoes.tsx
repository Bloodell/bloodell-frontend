import { useState } from 'react'

import { ErroDaApi, api } from '../api/cliente'
import { useRecurso } from '../api/useRecurso'
import { AvisoAcademico } from '../componentes/AvisoAcademico'
import { Cartao } from '../componentes/Cartao'
import { Estado } from '../componentes/Estado'
import { Cabecalho } from '../componentes/Layout'
import type { TipoComponente, Unidade } from '../tipos/api'

const TIPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMPONENTES: { valor: TipoComponente; rotulo: string; validade: string }[] = [
  { valor: 'CONCENTRADO_HEMACIAS', rotulo: 'Concentrado de hemácias', validade: '42 dias' },
  { valor: 'PLASMA', rotulo: 'Plasma', validade: '365 dias' },
  { valor: 'PLAQUETAS', rotulo: 'Plaquetas', validade: '5 dias' },
]

interface BolsaGerada {
  id: number
  codigo: string
  componente: string
  dataValidade: string
  status: string
}

interface RespostaDaDoacao {
  id: number
  codigo: string
  tipoSanguineo: string
  volumeMl: number
  bolsasGeradas: BolsaGerada[]
}

/**
 * UC1 -- registrar doacao sintetica e gerar as bolsas.
 *
 * Esta e a tela que prova "escrita seguida de consulta": ao salvar, as bolsas
 * geradas aparecem na hora e ja estao no estoque real.
 */
export function PaginaDeDoacoes() {
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')

  const [hemocentroId, setHemocentroId] = useState('')
  const [tipoSanguineo, setTipoSanguineo] = useState('O+')
  const [volumeMl, setVolumeMl] = useState('450')
  const [componentes, setComponentes] = useState<TipoComponente[]>(['CONCENTRADO_HEMACIAS'])

  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<RespostaDaDoacao | null>(null)

  function alternarComponente(valor: TipoComponente) {
    setComponentes((atuais) =>
      atuais.includes(valor) ? atuais.filter((item) => item !== valor) : [...atuais, valor],
    )
  }

  async function registrar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)
    setResultado(null)

    if (!hemocentroId) {
      setErro('Escolha o hemocentro que recebeu a doação.')
      return
    }
    if (componentes.length === 0) {
      setErro('Escolha ao menos um componente a ser gerado.')
      return
    }

    setEnviando(true)
    try {
      const resposta = await api.enviar<RespostaDaDoacao>('/doacoes', {
        hemocentroId: Number(hemocentroId),
        tipoSanguineo,
        volumeMl: Number(volumeMl),
        componentes,
      })
      setResultado(resposta)
    } catch (falha) {
      setErro(
        falha instanceof ErroDaApi ? falha.mensagemAmigavel : 'Não foi possível registrar a doação.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Registrar doação"
        descricao="Gera uma bolsa por componente, com validade calculada a partir da coleta"
      />

      <div className="pagina">
        <AvisoAcademico complemento="Os dados informados aqui são de simulação e não representam uma coleta real." />

        <Cartao titulo="Dados da doação">
          <Estado carregando={hemocentros.carregando} erro={hemocentros.erro} aoTentarNovamente={hemocentros.recarregar}>
            <form onSubmit={registrar}>
              <div className="formulario">
                <label className="campo">
                  <span className="campo__rotulo">Hemocentro</span>
                  <select
                    value={hemocentroId}
                    onChange={(evento) => setHemocentroId(evento.target.value)}
                    required
                  >
                    <option value="">Selecione…</option>
                    {(hemocentros.dados ?? []).map((unidade) => (
                      <option key={unidade.id} value={unidade.id}>
                        {unidade.nome}
                      </option>
                    ))}
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
                  <span className="campo__rotulo">Volume coletado (ml)</span>
                  <input
                    type="number"
                    min={100}
                    max={1000}
                    value={volumeMl}
                    onChange={(evento) => setVolumeMl(evento.target.value)}
                  />
                </label>
              </div>

              <fieldset style={{ border: 0, padding: 0, margin: '16px 0 0' }}>
                <legend className="campo__rotulo" style={{ padding: 0 }}>
                  Componentes a gerar
                </legend>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
                  {COMPONENTES.map((opcao) => (
                    <label key={opcao.valor} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={componentes.includes(opcao.valor)}
                        onChange={() => alternarComponente(opcao.valor)}
                      />
                      <span>
                        {opcao.rotulo}
                        <span className="cartao__ajuda"> · validade de {opcao.validade}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {erro && (
                <div className="aviso aviso--erro" role="alert" style={{ marginTop: 16 }}>
                  {erro}
                </div>
              )}

              <button type="submit" className="botao botao--primario" style={{ marginTop: 20 }} disabled={enviando}>
                {enviando ? 'Registrando…' : 'Registrar doação'}
              </button>
            </form>
          </Estado>
        </Cartao>

        {resultado && (
          <Cartao
            titulo={`Doação ${resultado.codigo} registrada`}
            ajuda="As bolsas abaixo já estão no estoque, com status DISPONÍVEL"
          >
            <div className="tabela__rolagem">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Código da bolsa</th>
                    <th>Componente</th>
                    <th>Validade</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.bolsasGeradas.map((bolsa) => (
                    <tr key={bolsa.id}>
                      <td><code>{bolsa.codigo}</code></td>
                      <td>{bolsa.componente}</td>
                      <td>{bolsa.dataValidade}</td>
                      <td>{bolsa.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rodape-tabela">
              A validade de cada bolsa vem do componente, contada a partir da data da
              coleta. Confira o resultado na tela de estoque.
            </div>
          </Cartao>
        )}
      </div>
    </>
  )
}
