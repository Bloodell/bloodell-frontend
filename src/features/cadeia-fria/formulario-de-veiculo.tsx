'use client'

import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { api } from '@/lib/api/cliente'
import type { Unidade, Veiculo } from '@/lib/api/tipos'

interface Valores {
  placa: string
  hemocentroId: string
  capacidade: string
}

const INICIAL: Valores = { placa: '', hemocentroId: '', capacidade: '20' }

function validar(valores: Valores): Partial<Record<keyof Valores, string>> {
  const erros: Partial<Record<keyof Valores, string>> = {}
  const capacidade = Number(valores.capacidade)
  if (!valores.placa.trim()) erros.placa = 'Informe a placa.'
  else if (valores.placa.trim().length > 10) erros.placa = 'Use no máximo 10 caracteres.'
  if (!valores.hemocentroId) erros.hemocentroId = 'Escolha a base do veículo.'
  if (!Number.isInteger(capacidade) || capacidade < 1) erros.capacidade = 'Pelo menos 1 bolsa.'
  return erros
}

export function FormularioDeVeiculo({ hemocentros, aoCadastrar }: { hemocentros: Unidade[]; aoCadastrar: () => void }) {
  const [valores, setValores] = useState<Valores>(INICIAL)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()

  // Os nomes do backend (hemocentroBaseId, capacidadeBolsas) viram os do formulario.
  const errosDaApi: Partial<Record<keyof Valores, string>> = {
    placa: envio.errosDaApi.placa,
    hemocentroId: envio.errosDaApi.hemocentroBaseId,
    capacidade: envio.errosDaApi.capacidadeBolsas,
  }
  const erros = tentouEnviar ? { ...validar(valores), ...semVazios(errosDaApi) } : semVazios(errosDaApi)

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validar(valores)).length > 0) return

    // A posicao inicial do veiculo e a coordenada do hemocentro de base.
    const base = hemocentros.find((unidade) => unidade.id === Number(valores.hemocentroId))
    if (!base) return

    const veiculo = await envio.executar(
      () =>
        api.enviar<Veiculo>('/veiculos', {
          placa: valores.placa.trim().toUpperCase(),
          hemocentroBaseId: base.id,
          capacidadeBolsas: Number(valores.capacidade),
          latitude: base.latitude,
          longitude: base.longitude,
        }),
      'Não foi possível cadastrar o veículo.',
    )

    if (veiculo) {
      toast.success(`Veículo ${veiculo.placa} na frota`, { description: `Base: ${base.nome}.` })
      aoCadastrar()
      setValores(INICIAL)
      setTentouEnviar(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-4">
        <Campo id="placa" rotulo="Placa" erro={erros.placa}>
          {(props) => (
            <Input
              {...props}
              value={valores.placa}
              maxLength={10}
              placeholder="ABC1D23"
              className="font-mono uppercase"
              onChange={(evento) => mudar('placa', evento.target.value)}
            />
          )}
        </Campo>
        <Campo id="capacidade" rotulo="Capacidade" erro={erros.capacidade}>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              inputMode="numeric"
              value={valores.capacidade}
              className="tabular-nums"
              onChange={(evento) => mudar('capacidade', evento.target.value)}
            />
          )}
        </Campo>
      </div>

      <Campo id="base" rotulo="Hemocentro de base" ajuda="A posição inicial será a coordenada da base." erro={erros.hemocentroId}>
        {(props) => (
          <Select {...props} value={valores.hemocentroId} onChange={(evento) => mudar('hemocentroId', evento.target.value)}>
            <option value="">Selecione</option>
            {hemocentros.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.nome}
              </option>
            ))}
          </Select>
        )}
      </Campo>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou o cadastro">{envio.erro}</Alerta>}

      <Button type="submit" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && <Plus />}
        {envio.enviando ? 'Cadastrando…' : 'Cadastrar veículo'}
      </Button>
    </form>
  )
}

/** Remove as chaves sem mensagem, para nao apagar o erro local de um campo. */
function semVazios<T extends Record<string, string | undefined>>(erros: T): Partial<T> {
  return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem)) as Partial<T>
}
