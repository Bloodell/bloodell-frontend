'use client'

import { Send } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { GrupoDeOpcoes } from '@/components/form/opcoes'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import type { EstadoDoRecurso } from '@/lib/api/use-recurso'
import type { Prioridade, Requisicao, Unidade } from '@/lib/api/tipos'
import { PRIORIDADES, plural } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { EditorDeItens } from './editor-de-itens'
import { criarRequisicao, errosDaApiPorItem, validarItem, type ErrosDoItem, type ItemDoFormulario } from './requisicoes-api'

export const COR_DA_PRIORIDADE: Record<Prioridade, string> = {
  EMERGENCIA: 'bg-critico',
  URGENTE: 'bg-atencao',
  ELETIVA: 'bg-muted-foreground',
}

function itemNovo(chave: number): ItemDoFormulario {
  return { chave, componente: 'CONCENTRADO_HEMACIAS', tipoSanguineo: 'O+', quantidade: '1' }
}

export function FormularioDeRequisicao({
  hospitais,
  aoCriar,
}: {
  hospitais: EstadoDoRecurso<Unidade[]>
  aoCriar: (requisicao: Requisicao) => void
}) {
  const proximaChave = useRef(1)
  const [hospitalEscolhido, setHospitalId] = useState('')
  const [prioridade, setPrioridade] = useState<Prioridade>('URGENTE')
  const [itens, setItens] = useState<ItemDoFormulario[]>(() => [itemNovo(0)])
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [chavesNoEnvio, setChavesNoEnvio] = useState<number[]>([])
  const envio = useEnvio()

  const lista = hospitais.dados ?? []
  // Conta vinculada a um so hospital: ja vem escolhido.
  const hospitalId = hospitalEscolhido || (lista.length === 1 ? String(lista[0].id) : '')

  const daApi = errosDaApiPorItem(envio.errosDaApi, chavesNoEnvio)
  const errosDosItens: Record<number, ErrosDoItem> = {}
  for (const item of itens) {
    const locais = tentouEnviar ? validarItem(item) : {}
    const remotos = daApi.porItem[item.chave] ?? {}
    if (Object.keys(locais).length || Object.keys(remotos).length) errosDosItens[item.chave] = { ...locais, ...remotos }
  }
  const erroDoHospital = daApi.gerais.hospitalId ?? (tentouEnviar && !hospitalId ? 'Escolha o hospital solicitante.' : undefined)
  const erroDaPrioridade = daApi.gerais.prioridade
  const erroDaLista = daApi.gerais.itens

  const totalDeBolsas = itens.reduce((soma, item) => soma + (Number(item.quantidade) || 0), 0)

  function mudarItem(chave: number, mudanca: Partial<ItemDoFormulario>) {
    setItens((atuais) => atuais.map((item) => (item.chave === chave ? { ...item, ...mudanca } : item)))
  }

  function adicionarItem() {
    setItens((atuais) => [...atuais, itemNovo(proximaChave.current++)])
  }

  function removerItem(chave: number) {
    setItens((atuais) => (atuais.length > 1 ? atuais.filter((item) => item.chave !== chave) : atuais))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    const invalido = !hospitalId || itens.length === 0 || itens.some((item) => Object.keys(validarItem(item)).length > 0)
    if (invalido) return

    setChavesNoEnvio(itens.map((item) => item.chave))
    const requisicao = await envio.executar(
      () =>
        criarRequisicao({
          hospitalId: Number(hospitalId),
          prioridade,
          itens: itens.map((item) => ({
            componente: item.componente,
            tipoSanguineo: item.tipoSanguineo,
            quantidade: Number(item.quantidade),
          })),
        }),
      'Não foi possível criar a requisição.',
    )

    if (requisicao) {
      toast.success(`Requisição ${requisicao.codigo} na fila`, {
        description: 'A posição na fila depende da prioridade e da ordem de chegada.',
      })
      aoCriar(requisicao)
      setItens([itemNovo(proximaChave.current++)])
      setPrioridade('URGENTE')
      setTentouEnviar(false)
    }
  }

  if (hospitais.carregando && !hospitais.dados) {
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

  if (lista.length === 0) {
    return (
      <Alerta tipo="info" titulo="Nenhum hospital disponível para sua conta">
        Para pedir hemocomponentes, a conta precisa estar vinculada a um hospital. Fale com o administrador da rede.
      </Alerta>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <Campo id="hospital" rotulo="Hospital solicitante" erro={erroDoHospital}>
        {(props) => (
          <Select {...props} value={hospitalId} onChange={(evento) => setHospitalId(evento.target.value)}>
            <option value="">Selecione o hospital</option>
            {lista.map((unidade) => (
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
        ajuda={PRIORIDADES.find((opcao) => opcao.valor === prioridade)?.descricao}
        erro={erroDaPrioridade}
      >
        {() => (
          <GrupoDeOpcoes
            nome="prioridade"
            rotulo="Prioridade"
            valor={prioridade}
            aoMudar={setPrioridade}
            opcoes={PRIORIDADES.map((opcao) => ({
              valor: opcao.valor,
              rotulo: opcao.rotulo,
              marcador: <span className={cn('size-1.5 rounded-full', COR_DA_PRIORIDADE[opcao.valor])} aria-hidden="true" />,
            }))}
          />
        )}
      </Campo>

      <fieldset className="space-y-3">
        <legend className="mb-2 flex w-full items-baseline justify-between gap-3 text-rotulo font-medium">
          O que o hospital precisa
          <span className="text-apoio font-normal text-muted-foreground tabular-nums">
            {plural(itens.length, 'item', 'itens')} · {plural(totalDeBolsas, 'bolsa')}
          </span>
        </legend>
        <EditorDeItens itens={itens} erros={errosDosItens} aoMudar={mudarItem} aoAdicionar={adicionarItem} aoRemover={removerItem} />
        {erroDaLista && <p className="text-apoio text-critico">{erroDaLista}</p>}
      </fieldset>

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou a requisição">{envio.erro}</Alerta>}

      <Button type="submit" size="lg" className="w-full" carregando={envio.enviando}>
        {!envio.enviando && <Send />}
        {envio.enviando ? 'Enviando…' : 'Criar requisição'}
      </Button>
    </form>
  )
}
