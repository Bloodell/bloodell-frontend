'use client'

import { Minus, Plus, Send } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { GrupoDeOpcoes } from '@/components/form/opcoes'
import { SeletorDeTipoSanguineo } from '@/components/form/seletor-de-tipo-sanguineo'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api/cliente'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { Prioridade, Requisicao, TipoComponente, Unidade } from '@/lib/api/tipos'
import { COMPONENTES, PRIORIDADES } from '@/lib/formatos'
import { cn } from '@/lib/utils'

interface Valores {
  hospitalId: string
  prioridade: Prioridade
  componente: TipoComponente
  tipoSanguineo: string
  quantidade: string
}

const INICIAL: Valores = {
  hospitalId: '',
  prioridade: 'URGENTE',
  componente: 'CONCENTRADO_HEMACIAS',
  tipoSanguineo: 'O+',
  quantidade: '1',
}

const COR_DA_PRIORIDADE: Record<Prioridade, string> = {
  EMERGENCIA: 'bg-red-500',
  URGENTE: 'bg-amber-500',
  ELETIVA: 'bg-muted-foreground/50',
}

function validar(valores: Valores): Partial<Record<keyof Valores, string>> {
  const erros: Partial<Record<keyof Valores, string>> = {}
  const quantidade = Number(valores.quantidade)
  if (!valores.hospitalId) erros.hospitalId = 'Escolha o hospital solicitante.'
  if (!Number.isInteger(quantidade) || quantidade < 1) erros.quantidade = 'A quantidade deve ser pelo menos 1 bolsa.'
  return erros
}

/** "itens[0].quantidade" (nome do campo no backend) vira "quantidade". */
function errosDoFormulario(errosDaApi: Record<string, string>) {
  return Object.fromEntries(Object.entries(errosDaApi).map(([campo, mensagem]) => [campo.replace(/^itens\[\d+\]\./, ''), mensagem]))
}

export function FormularioDeRequisicao({
  hospitais,
  aoCriar,
}: {
  hospitais: EstadoDoRecurso<Unidade[]>
  aoCriar: (requisicao: Requisicao) => void
}) {
  const [valores, setValores] = useState<Valores>(INICIAL)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const envio = useEnvio()

  const errosDaApi = errosDoFormulario(envio.errosDaApi)
  const erros: Partial<Record<string, string>> = tentouEnviar ? { ...validar(valores), ...errosDaApi } : errosDaApi

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  function ajustarQuantidade(delta: number) {
    mudar('quantidade', String(Math.max(1, (Number(valores.quantidade) || 0) + delta)))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validar(valores)).length > 0) return

    const requisicao = await envio.executar(
      () =>
        api.enviar<Requisicao>('/requisicoes', {
          hospitalId: Number(valores.hospitalId),
          prioridade: valores.prioridade,
          itens: [
            { componente: valores.componente, tipoSanguineo: valores.tipoSanguineo, quantidade: Number(valores.quantidade) },
          ],
        }),
      'Não foi possível criar a requisição.',
    )

    if (requisicao) {
      toast.success(`Requisição ${requisicao.codigo} na fila`, {
        description: 'A posição na fila depende da prioridade e da ordem de chegada.',
      })
      aoCriar(requisicao)
      setValores({ ...INICIAL, hospitalId: valores.hospitalId })
      setTentouEnviar(false)
    }
  }

  if (hospitais.carregando) {
    return (
      <div className="space-y-6">
        {[0, 1, 2, 3].map((indice) => (
          <div key={indice} className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (hospitais.erro) {
    return (
      <Alerta tipo="erro" titulo="Não foi possível carregar os hospitais">
        {hospitais.erro}{' '}
        <button type="button" className="font-medium underline underline-offset-2" onClick={hospitais.recarregar}>
          Tentar novamente
        </button>
      </Alerta>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <Campo id="hospital" rotulo="Hospital solicitante" erro={erros.hospitalId}>
        {(props) => (
          <Select {...props} value={valores.hospitalId} onChange={(evento) => mudar('hospitalId', evento.target.value)}>
            <option value="">Selecione o hospital</option>
            {(hospitais.dados ?? []).map((unidade) => (
              <option key={unidade.id} value={unidade.id}>
                {unidade.nome} · {unidade.cidade}/{unidade.uf}
              </option>
            ))}
          </Select>
        )}
      </Campo>

      <Campo
        id="prioridade"
        rotulo="Prioridade"
        ajuda={PRIORIDADES.find((opcao) => opcao.valor === valores.prioridade)?.descricao}
        erro={erros.prioridade}
      >
        {() => (
          <GrupoDeOpcoes
            nome="prioridade"
            rotulo="Prioridade"
            valor={valores.prioridade}
            aoMudar={(prioridade) => mudar('prioridade', prioridade)}
            opcoes={PRIORIDADES.map((opcao) => ({
              valor: opcao.valor,
              rotulo: opcao.rotulo,
              marcador: <span className={cn('size-1.5 rounded-full', COR_DA_PRIORIDADE[opcao.valor])} aria-hidden="true" />,
            }))}
          />
        )}
      </Campo>

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_140px]">
        <Campo id="componente" rotulo="Hemocomponente" erro={erros.componente}>
          {(props) => (
            <Select
              {...props}
              value={valores.componente}
              onChange={(evento) => mudar('componente', evento.target.value as TipoComponente)}
            >
              {COMPONENTES.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </Select>
          )}
        </Campo>

        <Campo id="quantidade" rotulo="Quantidade" erro={erros.quantidade}>
          {(props) => (
            <div className="flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-r-none border-r-0"
                onClick={() => ajustarQuantidade(-1)}
                aria-label="Diminuir quantidade"
              >
                <Minus />
              </Button>
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={1}
                value={valores.quantidade}
                onChange={(evento) => mudar('quantidade', evento.target.value)}
                className="rounded-none text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-l-none border-l-0"
                onClick={() => ajustarQuantidade(1)}
                aria-label="Aumentar quantidade"
              >
                <Plus />
              </Button>
            </div>
          )}
        </Campo>
      </div>

      <Campo id="tipo-solicitado" rotulo="Tipo sanguíneo" erro={erros.tipoSanguineo}>
        {(props) => (
          <SeletorDeTipoSanguineo
            id={props.id}
            nome="tipoSolicitado"
            valor={valores.tipoSanguineo}
            aoMudar={(tipo) => mudar('tipoSanguineo', tipo)}
          />
        )}
      </Campo>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou a requisição">{envio.erro}</Alerta>}

      <Button type="submit" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && <Send />}
        {envio.enviando ? 'Enviando…' : 'Criar requisição'}
      </Button>
    </form>
  )
}
