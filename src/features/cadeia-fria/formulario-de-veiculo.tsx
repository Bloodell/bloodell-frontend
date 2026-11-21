'use client'

import { Plus, Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Unidade, Veiculo } from '@/lib/api/tipos'
import { salvarVeiculo } from './veiculos-api'

interface Valores {
  placa: string
  hemocentroId: string
  capacidade: string
  latitude: string
  longitude: string
}

const INICIAL: Valores = { placa: '', hemocentroId: '', capacidade: '20', latitude: '', longitude: '' }

function validar(valores: Valores, editando: boolean): Partial<Record<keyof Valores, string>> {
  const erros: Partial<Record<keyof Valores, string>> = {}
  const capacidade = Number(valores.capacidade)
  if (!valores.placa.trim()) erros.placa = 'Informe a placa.'
  else if (valores.placa.trim().length > 10) erros.placa = 'Use no máximo 10 caracteres.'
  if (!valores.hemocentroId) erros.hemocentroId = 'Escolha a base do veículo.'
  if (!Number.isInteger(capacidade) || capacidade < 1) erros.capacidade = 'Pelo menos 1 bolsa.'
  if (editando) {
    const latitude = Number(valores.latitude)
    const longitude = Number(valores.longitude)
    if (valores.latitude.trim() === '' || Number.isNaN(latitude) || latitude < -90 || latitude > 90)
      erros.latitude = 'Entre -90 e 90.'
    if (valores.longitude.trim() === '' || Number.isNaN(longitude) || longitude < -180 || longitude > 180)
      erros.longitude = 'Entre -180 e 180.'
  }
  return erros
}

/**
 * Cadastro (posicao inicial = coordenada da base) ou edicao do cadastro do
 * veiculo. O status nao e editavel: muda pelas etapas da entrega.
 */
export function FormularioDeVeiculo({
  hemocentros,
  veiculo = null,
  aoSalvar,
}: {
  hemocentros: Unidade[]
  veiculo?: Veiculo | null
  aoSalvar: (veiculo: Veiculo) => void
}) {
  const editando = veiculo !== null
  const [valores, setValores] = useState<Valores>(
    veiculo
      ? {
          placa: veiculo.placa,
          hemocentroId: String(veiculo.hemocentroBaseId),
          capacidade: String(veiculo.capacidadeBolsas),
          latitude: String(veiculo.latitude),
          longitude: String(veiculo.longitude),
        }
      : INICIAL,
  )
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()
  const prefixo = editando ? `veiculo-${veiculo.id}` : 'novo-veiculo'

  // Os nomes do backend (hemocentroBaseId, capacidadeBolsas) viram os do formulario.
  const errosDaApi: Partial<Record<keyof Valores, string>> = {
    placa: envio.errosDaApi.placa,
    hemocentroId: envio.errosDaApi.hemocentroBaseId,
    capacidade: envio.errosDaApi.capacidadeBolsas,
    latitude: envio.errosDaApi.latitude,
    longitude: envio.errosDaApi.longitude,
  }
  const erros = tentouEnviar ? { ...validar(valores, editando), ...semVazios(errosDaApi) } : semVazios(errosDaApi)

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  const base = hemocentros.find((unidade) => unidade.id === Number(valores.hemocentroId))

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validar(valores, editando)).length > 0 || !base) return

    const salvo = await envio.executar(
      () =>
        salvarVeiculo(veiculo?.id ?? null, {
          placa: valores.placa.trim().toUpperCase(),
          hemocentroBaseId: base.id,
          capacidadeBolsas: Number(valores.capacidade),
          latitude: editando ? Number(valores.latitude) : base.latitude,
          longitude: editando ? Number(valores.longitude) : base.longitude,
        }),
      editando ? 'Não foi possível salvar o veículo.' : 'Não foi possível cadastrar o veículo.',
    )

    if (salvo) {
      toast.success(editando ? `Veículo ${salvo.placa} atualizado` : `Veículo ${salvo.placa} na frota`, {
        description: `Base: ${salvo.hemocentroBaseNome}.`,
      })
      aoSalvar(salvo)
      if (!editando) {
        setValores(INICIAL)
        setTentouEnviar(false)
      }
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-4">
        <Campo id={`${prefixo}-placa`} rotulo="Placa" erro={erros.placa}>
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
        <Campo id={`${prefixo}-capacidade`} rotulo="Capacidade" erro={erros.capacidade}>
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

      <Campo
        id={`${prefixo}-base`}
        rotulo="Hemocentro de base"
        ajuda={editando ? undefined : 'A posição inicial será a coordenada da base.'}
        erro={erros.hemocentroId}
      >
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

      {editando && (
        <fieldset className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <legend className="text-rotulo font-medium">Posição cadastral</legend>
            {base && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0"
                onClick={() => setValores((atuais) => ({ ...atuais, latitude: String(base.latitude), longitude: String(base.longitude) }))}
              >
                Usar a coordenada da base
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Campo id={`${prefixo}-latitude`} rotulo="Latitude" erro={erros.latitude}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={valores.latitude}
                  className="tabular-nums"
                  onChange={(evento) => mudar('latitude', evento.target.value)}
                />
              )}
            </Campo>
            <Campo id={`${prefixo}-longitude`} rotulo="Longitude" erro={erros.longitude}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={valores.longitude}
                  className="tabular-nums"
                  onChange={(evento) => mudar('longitude', evento.target.value)}
                />
              )}
            </Campo>
          </div>
          <p className="text-apoio text-muted-foreground">
            É a posição guardada no cadastro, não uma leitura de GPS. A telemetria registra as posições reais.
          </p>
        </fieldset>
      )}

      {envio.erro && (
        <Alerta tipo="erro" titulo={editando ? 'A API recusou a alteração' : 'A API recusou o cadastro'}>
          {envio.erro}
        </Alerta>
      )}

      <Button type="submit" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && (editando ? <Save /> : <Plus />)}
        {envio.enviando ? 'Salvando…' : editando ? 'Salvar veículo' : 'Cadastrar veículo'}
      </Button>
    </form>
  )
}

/** Remove as chaves sem mensagem, para nao apagar o erro local de um campo. */
function semVazios<T extends Record<string, string | undefined>>(erros: T): Partial<T> {
  return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem)) as Partial<T>
}
