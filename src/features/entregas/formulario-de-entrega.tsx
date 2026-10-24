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
import { api } from '@/lib/api/cliente'
import type { Entrega, Requisicao, Unidade, Veiculo } from '@/lib/api/tipos'
import { rotulo } from '@/lib/formatos'

interface Valores {
  requisicaoId: string
  veiculoId: string
  origemId: string
  rota: string
}

const INICIAL: Valores = { requisicaoId: '', veiculoId: '', origemId: '', rota: '' }

function validar(valores: Valores): Partial<Record<keyof Valores, string>> {
  const erros: Partial<Record<keyof Valores, string>> = {}
  if (!valores.requisicaoId) erros.requisicaoId = 'Escolha uma requisição com bolsas alocadas.'
  if (!valores.veiculoId) erros.veiculoId = 'Escolha o veículo.'
  if (!valores.origemId) erros.origemId = 'Escolha o hemocentro de origem.'
  return erros
}

export function FormularioDeEntrega({
  aptas,
  veiculos,
  origens,
  aoPlanejar,
}: {
  aptas: Requisicao[]
  veiculos: Veiculo[]
  origens: Unidade[]
  aoPlanejar: () => void
}) {
  const [valores, setValores] = useState<Valores>(INICIAL)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()

  const erros = tentouEnviar ? { ...validar(valores), ...envio.errosDaApi } : envio.errosDaApi

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validar(valores)).length > 0) return

    const entrega = await envio.executar(
      () =>
        api.enviar<Entrega>('/entregas', {
          requisicaoId: Number(valores.requisicaoId),
          veiculoId: Number(valores.veiculoId),
          origemId: Number(valores.origemId),
          rota: valores.rota.trim() || null,
        }),
      'Não foi possível planejar a entrega.',
    )

    if (entrega) {
      toast.success(`Entrega da ${entrega.requisicaoCodigo} planejada`, { description: `Veículo ${entrega.veiculoPlaca}.` })
      aoPlanejar()
      setValores(INICIAL)
      setTentouEnviar(false)
    }
  }

  if (aptas.length === 0) {
    return (
      <Alerta tipo="info" titulo="Nenhuma requisição pronta para entrega">
        Crie e processe uma requisição em Requisições. Quando ela ficar alocada, aparece aqui.
      </Alerta>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <Campo id="requisicao" rotulo="Requisição alocada" erro={erros.requisicaoId}>
        {(props) => (
          <Select {...props} value={valores.requisicaoId} onChange={(evento) => mudar('requisicaoId', evento.target.value)}>
            <option value="">Selecione</option>
            {aptas.map((requisicao) => (
              <option key={requisicao.id} value={requisicao.id}>
                {requisicao.codigo} · {requisicao.hospitalNome}
              </option>
            ))}
          </Select>
        )}
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Campo id="veiculo" rotulo="Veículo" erro={erros.veiculoId}>
          {(props) => (
            <Select {...props} value={valores.veiculoId} onChange={(evento) => mudar('veiculoId', evento.target.value)}>
              <option value="">Selecione</option>
              {veiculos.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} · {rotulo(veiculo.status)}
                </option>
              ))}
            </Select>
          )}
        </Campo>
        <Campo id="origem" rotulo="Origem" erro={erros.origemId}>
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

      <Campo id="rota" rotulo="Descrição da rota" opcional erro={erros.rota}>
        {(props) => (
          <Input
            {...props}
            value={valores.rota}
            placeholder="Hemocentro Recife → Hospital Central"
            onChange={(evento) => mudar('rota', evento.target.value)}
          />
        )}
      </Campo>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou o planejamento">{envio.erro}</Alerta>}

      <Button type="submit" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && <Route />}
        {envio.enviando ? 'Planejando…' : 'Planejar entrega'}
      </Button>
    </form>
  )
}
