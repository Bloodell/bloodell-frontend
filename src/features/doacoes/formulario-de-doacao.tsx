'use client'

import { Droplet } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { OpcaoMarcavel } from '@/components/form/opcoes'
import { SeletorDeTipoSanguineo } from '@/components/form/seletor-de-tipo-sanguineo'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api/cliente'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { Doacao, TipoComponente, Unidade } from '@/lib/api/tipos'
import { COMPONENTES } from '@/lib/formatos'

interface Valores {
  hemocentroId: string
  tipoSanguineo: string
  volumeMl: string
  componentes: TipoComponente[]
}

const INICIAL: Valores = {
  hemocentroId: '',
  tipoSanguineo: 'O+',
  volumeMl: '450',
  componentes: ['CONCENTRADO_HEMACIAS'],
}

/** As mesmas regras do DoacaoRequisicao do backend, checadas antes de enviar. */
function validar(valores: Valores): Partial<Record<keyof Valores, string>> {
  const erros: Partial<Record<keyof Valores, string>> = {}
  const volume = Number(valores.volumeMl)
  if (!valores.hemocentroId) erros.hemocentroId = 'Escolha o hemocentro que recebeu a doação.'
  if (!valores.volumeMl || !Number.isInteger(volume)) erros.volumeMl = 'Informe o volume em ml, sem casas decimais.'
  else if (volume < 100 || volume > 1000) erros.volumeMl = 'O volume deve ficar entre 100 e 1000 ml.'
  if (valores.componentes.length === 0) erros.componentes = 'Escolha ao menos um componente a gerar.'
  return erros
}

export function FormularioDeDoacao({
  hemocentros,
  aoRegistrar,
}: {
  hemocentros: EstadoDoRecurso<Unidade[]>
  aoRegistrar: (doacao: Doacao) => void
}) {
  const [valores, setValores] = useState<Valores>(INICIAL)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()

  // Erros so aparecem depois da primeira tentativa, e somem conforme corrigidos.
  const erros = tentouEnviar ? { ...validar(valores), ...envio.errosDaApi } : envio.errosDaApi

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  function alternarComponente(componente: TipoComponente) {
    mudar(
      'componentes',
      valores.componentes.includes(componente)
        ? valores.componentes.filter((item) => item !== componente)
        : [...valores.componentes, componente],
    )
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validar(valores)).length > 0) return

    const doacao = await envio.executar(
      () =>
        api.enviar<Doacao>('/doacoes', {
          hemocentroId: Number(valores.hemocentroId),
          tipoSanguineo: valores.tipoSanguineo,
          volumeMl: Number(valores.volumeMl),
          componentes: valores.componentes,
        }),
      'Não foi possível registrar a doação.',
    )

    if (doacao) {
      toast.success(`Doação ${doacao.codigo} registrada`, {
        description: `${doacao.bolsasGeradas.length} bolsa(s) já estão no estoque.`,
      })
      aoRegistrar(doacao)
      setValores({ ...INICIAL, hemocentroId: valores.hemocentroId })
      setTentouEnviar(false)
    }
  }

  if (hemocentros.carregando) {
    return (
      <div className="space-y-6">
        {[0, 1, 2].map((indice) => (
          <div key={indice} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (hemocentros.erro) {
    return (
      <Alerta tipo="erro" titulo="Não foi possível carregar os hemocentros">
        {hemocentros.erro}{' '}
        <button type="button" className="font-medium underline underline-offset-2" onClick={hemocentros.recarregar}>
          Tentar novamente
        </button>
      </Alerta>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Campo id="hemocentro" rotulo="Hemocentro" erro={erros.hemocentroId} className="sm:col-span-2">
          {(props) => (
            <Select {...props} value={valores.hemocentroId} onChange={(evento) => mudar('hemocentroId', evento.target.value)}>
              <option value="">Selecione o hemocentro</option>
              {(hemocentros.dados ?? []).map((unidade) => (
                <option key={unidade.id} value={unidade.id}>
                  {unidade.nome} · {unidade.cidade}/{unidade.uf}
                </option>
              ))}
            </Select>
          )}
        </Campo>

        <Campo id="tipo-sanguineo" rotulo="Tipo sanguíneo" erro={erros.tipoSanguineo}>
          {(props) => (
            <SeletorDeTipoSanguineo
              id={props.id}
              nome="tipoSanguineo"
              valor={valores.tipoSanguineo}
              aoMudar={(tipo) => mudar('tipoSanguineo', tipo)}
            />
          )}
        </Campo>

        <Campo id="volume" rotulo="Volume coletado" ajuda="Entre 100 e 1000 ml." erro={erros.volumeMl}>
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={100}
                max={1000}
                step={10}
                value={valores.volumeMl}
                onChange={(evento) => mudar('volumeMl', evento.target.value)}
                className="pr-10 tabular-nums"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] text-muted-foreground">
                ml
              </span>
            </div>
          )}
        </Campo>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-[13px] font-medium">Componentes a gerar</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {COMPONENTES.map((opcao) => (
            <OpcaoMarcavel
              key={opcao.valor}
              titulo={opcao.rotulo}
              descricao={`Validade de ${opcao.validadeDias} dias`}
              marcada={valores.componentes.includes(opcao.valor)}
              aoAlternar={() => alternarComponente(opcao.valor)}
              invalida={Boolean(erros.componentes)}
            />
          ))}
        </div>
        {erros.componentes && <p className="text-xs text-destructive animate-entrar">{erros.componentes}</p>}
      </fieldset>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou a doação">{envio.erro}</Alerta>}

      <div className="flex items-center justify-between gap-4 border-t pt-5">
        <p className="text-xs text-muted-foreground">Uma bolsa é gerada para cada componente marcado.</p>
        <Button type="submit" carregando={envio.enviando}>
          {!envio.enviando && <Droplet />}
          {envio.enviando ? 'Registrando…' : 'Registrar doação'}
        </Button>
      </div>
    </form>
  )
}
