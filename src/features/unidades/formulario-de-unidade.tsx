'use client'

import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { GrupoDeOpcoes } from '@/components/form/opcoes'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api/cliente'
import type { Unidade } from '@/lib/api/tipos'

export type TipoDeUnidade = 'hemocentros' | 'hospitais'

interface Valores {
  tipo: TipoDeUnidade
  nome: string
  cidade: string
  uf: string
  latitude: string
  longitude: string
}

const INICIAL: Valores = { tipo: 'hemocentros', nome: '', cidade: '', uf: '', latitude: '', longitude: '' }

/** As regras do UnidadeRequisicao do backend. */
function validar(valores: Valores): Partial<Record<keyof Valores, string>> {
  const erros: Partial<Record<keyof Valores, string>> = {}
  const latitude = Number(valores.latitude)
  const longitude = Number(valores.longitude)
  if (!valores.nome.trim()) erros.nome = 'Informe o nome da unidade.'
  else if (valores.nome.trim().length > 120) erros.nome = 'Use no máximo 120 caracteres.'
  if (!valores.cidade.trim()) erros.cidade = 'Informe a cidade.'
  if (!/^[A-Za-z]{2}$/.test(valores.uf.trim())) erros.uf = 'Use a sigla com 2 letras.'
  if (valores.latitude === '' || Number.isNaN(latitude) || latitude < -90 || latitude > 90)
    erros.latitude = 'Entre -90 e 90.'
  if (valores.longitude === '' || Number.isNaN(longitude) || longitude < -180 || longitude > 180)
    erros.longitude = 'Entre -180 e 180.'
  return erros
}

export function FormularioDeUnidade({ aoCadastrar }: { aoCadastrar: (tipo: TipoDeUnidade) => void }) {
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

    const unidade = await envio.executar(
      () =>
        api.enviar<Unidade>(`/${valores.tipo}`, {
          nome: valores.nome.trim(),
          cidade: valores.cidade.trim(),
          uf: valores.uf.trim().toUpperCase(),
          latitude: Number(valores.latitude),
          longitude: Number(valores.longitude),
        }),
      'Não foi possível cadastrar a unidade.',
    )

    if (unidade) {
      toast.success(`${unidade.nome} cadastrado`, {
        description: valores.tipo === 'hemocentros' ? 'Já pode receber doações.' : 'Já pode criar requisições.',
      })
      aoCadastrar(valores.tipo)
      setValores({ ...INICIAL, tipo: valores.tipo })
      setTentouEnviar(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <GrupoDeOpcoes
        nome="tipo"
        rotulo="Tipo de unidade"
        valor={valores.tipo}
        aoMudar={(tipo) => mudar('tipo', tipo)}
        opcoes={[
          { valor: 'hemocentros', rotulo: 'Hemocentro' },
          { valor: 'hospitais', rotulo: 'Hospital' },
        ]}
      />

      <Campo id="nome" rotulo="Nome" ajuda="Use apenas nomes fictícios." erro={erros.nome}>
        {(props) => (
          <Input
            {...props}
            value={valores.nome}
            maxLength={120}
            placeholder={valores.tipo === 'hemocentros' ? 'Hemocentro Central' : 'Hospital da Boa Vista'}
            onChange={(evento) => mudar('nome', evento.target.value)}
          />
        )}
      </Campo>

      <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-4">
        <Campo id="cidade" rotulo="Cidade" erro={erros.cidade}>
          {(props) => (
            <Input {...props} value={valores.cidade} placeholder="Recife" onChange={(evento) => mudar('cidade', evento.target.value)} />
          )}
        </Campo>
        <Campo id="uf" rotulo="UF" erro={erros.uf}>
          {(props) => (
            <Input
              {...props}
              value={valores.uf}
              maxLength={2}
              placeholder="PE"
              className="uppercase"
              onChange={(evento) => mudar('uf', evento.target.value)}
            />
          )}
        </Campo>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="latitude" rotulo="Latitude" erro={erros.latitude}>
          {(props) => (
            <Input
              {...props}
              type="number"
              step="any"
              inputMode="decimal"
              value={valores.latitude}
              placeholder="-8.0476"
              className="tabular-nums"
              onChange={(evento) => mudar('latitude', evento.target.value)}
            />
          )}
        </Campo>
        <Campo id="longitude" rotulo="Longitude" erro={erros.longitude}>
          {(props) => (
            <Input
              {...props}
              type="number"
              step="any"
              inputMode="decimal"
              value={valores.longitude}
              placeholder="-34.8770"
              className="tabular-nums"
              onChange={(evento) => mudar('longitude', evento.target.value)}
            />
          )}
        </Campo>
      </div>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou o cadastro">{envio.erro}</Alerta>}

      <Button type="submit" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && <Plus />}
        {envio.enviando ? 'Cadastrando…' : 'Cadastrar unidade'}
      </Button>
    </form>
  )
}
