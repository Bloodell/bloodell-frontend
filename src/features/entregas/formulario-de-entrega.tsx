'use client'

import { Route } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Entrega, Requisicao, Unidade, Veiculo } from '@/lib/api/tipos'
import { plural } from '@/lib/formatos'
import { criarEntrega, numeroOuNulo, validarPlanejamento } from './entregas-api'
import { SeletorDeRequisicao } from './seletor-de-requisicao'

interface Valores {
  requisicaoId: number | null
  veiculoId: string
  origemId: string
  tempoEstimadoMin: string
}

function validar(valores: Valores) {
  const erros: Partial<Record<'requisicaoId' | 'veiculoId' | 'origemId' | 'tempoEstimadoMin', string>> = {}
  if (valores.requisicaoId === null) erros.requisicaoId = 'Escolha uma requisição com bolsas alocadas.'
  if (!valores.veiculoId) erros.veiculoId = 'Escolha um veículo disponível.'
  if (!valores.origemId) erros.origemId = 'Escolha o hemocentro de origem.'
  const tempo = validarPlanejamento({ distanciaKm: '', tempoEstimadoMin: valores.tempoEstimadoMin }).tempoEstimadoMin
  if (tempo) erros.tempoEstimadoMin = tempo
  return erros
}

/**
 * Planeja a entrega. A rota NAO e digitada: depois de criar, "Calcular rota"
 * pede ao backend as paradas e a distancia. Por isso a criacao manda rota null.
 */
export function FormularioDeEntrega({
  veiculos,
  origens,
  comEntregaAtiva,
  requisicaoInicial,
  aoPlanejar,
}: {
  veiculos: Veiculo[]
  origens: Unidade[]
  comEntregaAtiva: Set<number>
  requisicaoInicial: number | null
  aoPlanejar: (entrega: Entrega) => void
}) {
  const [valores, setValores] = useState<Valores>({
    requisicaoId: requisicaoInicial,
    veiculoId: '',
    origemId: origens.length === 1 ? String(origens[0].id) : '',
    tempoEstimadoMin: '',
  })
  const [escolhida, setEscolhida] = useState<Requisicao | null>(null)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()

  // Veio de outra tela (?requisicao=ID): pode nao estar na primeira pagina.
  const inicial = useRecurso<Requisicao>(requisicaoInicial !== null && escolhida === null ? `/requisicoes/${requisicaoInicial}` : null)
  const resumo = escolhida ?? (inicial.dados?.id === valores.requisicaoId ? inicial.dados : null)

  const disponiveis = veiculos.filter((veiculo) => veiculo.status === 'DISPONIVEL')
  const indisponiveis = veiculos.length - disponiveis.length

  const erros = tentouEnviar ? { ...validar(valores), ...envio.errosDaApi } : envio.errosDaApi

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validar(valores)).length > 0 || valores.requisicaoId === null) return
    const requisicaoId = valores.requisicaoId

    const entrega = await envio.executar(
      () =>
        criarEntrega({
          requisicaoId,
          veiculoId: Number(valores.veiculoId),
          origemId: Number(valores.origemId),
          rota: null,
          distanciaKm: null,
          tempoEstimadoMin: numeroOuNulo(valores.tempoEstimadoMin),
        }),
      'Não foi possível planejar a entrega.',
    )

    if (entrega) {
      toast.success(`Entrega da ${entrega.requisicaoCodigo} planejada`, {
        description: `Veículo ${entrega.veiculoPlaca}. Agora calcule a rota no detalhe da entrega.`,
      })
      aoPlanejar(entrega)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <Campo id="requisicao" rotulo="Requisição alocada" erro={erros.requisicaoId}>
        {(props) => (
          <div className="space-y-2">
            {resumo && !escolhida && (
              <p className="rounded-md bg-secondary/60 px-3 py-2 text-apoio">
                Selecionada: <span className="font-mono font-medium">{resumo.codigo}</span> · {resumo.hospitalNome}
              </p>
            )}
            <SeletorDeRequisicao
              valor={valores.requisicaoId}
              aoMudar={(requisicao) => {
                setEscolhida(requisicao)
                mudar('requisicaoId', requisicao.id)
              }}
              comEntregaAtiva={comEntregaAtiva}
              idDaMensagem={props['aria-describedby']}
              invalido={Boolean(erros.requisicaoId)}
            />
          </div>
        )}
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo
          id="veiculo"
          rotulo="Veículo"
          erro={erros.veiculoId}
          ajuda={indisponiveis > 0 ? `${plural(indisponiveis, 'veículo')} em rota ou manutenção não aparece(m).` : undefined}
        >
          {(props) => (
            <Select {...props} value={valores.veiculoId} onChange={(evento) => mudar('veiculoId', evento.target.value)}>
              <option value="">{disponiveis.length === 0 ? 'Nenhum disponível' : 'Selecione'}</option>
              {disponiveis.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} · {veiculo.capacidadeBolsas} bolsas · {veiculo.hemocentroBaseNome}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo id="origem" rotulo="Hemocentro de origem" erro={erros.origemId}>
          {(props) => (
            <Select {...props} value={valores.origemId} onChange={(evento) => mudar('origemId', evento.target.value)}>
              <option value="">Selecione</option>
              {origens.map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.nome}
                </option>
              ))}
            </Select>
          )}
        </Campo>
      </div>

      <Campo
        id="tempo-estimado"
        rotulo="Tempo estimado (min)"
        opcional
        erro={erros.tempoEstimadoMin}
        ajuda="Pode preencher depois. A distância vem do cálculo de rota."
      >
        {(props) => (
          <Input
            {...props}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={valores.tempoEstimadoMin}
            onChange={(evento) => mudar('tempoEstimadoMin', evento.target.value)}
            className="w-40 tabular-nums"
          />
        )}
      </Campo>

      <p className="text-apoio text-muted-foreground">
        O backend confere a regra no envio: requisição alocada e sem outra entrega ativa, veículo disponível e origem
        hemocentro. Capacidade do veículo e origem das bolsas ainda não são validadas por ele.
      </p>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou o planejamento">{envio.erro}</Alerta>}

      <Button type="submit" size="lg" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && <Route />}
        {envio.enviando ? 'Planejando…' : 'Planejar entrega'}
      </Button>
    </form>
  )
}
