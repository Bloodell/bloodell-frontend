'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Campo } from '@/components/form/campo'
import { SeletorDeTipoSanguineo } from '@/components/form/seletor-de-tipo-sanguineo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { TipoComponente } from '@/lib/api/tipos'
import { COMPONENTES } from '@/lib/formatos'
import type { ErrosDoItem, ItemDoFormulario } from './requisicoes-api'

/** Cada hemocomponente pedido e um cartao numerado: componente, tipo e quantidade. */
export function EditorDeItens({
  itens,
  erros,
  aoMudar,
  aoAdicionar,
  aoRemover,
}: {
  itens: ItemDoFormulario[]
  erros: Record<number, ErrosDoItem>
  aoMudar: (chave: number, mudanca: Partial<ItemDoFormulario>) => void
  aoAdicionar: () => void
  aoRemover: (chave: number) => void
}) {
  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {itens.map((item, indice) => {
          const doItem = erros[item.chave] ?? {}
          const prefixo = `item-${item.chave}`
          return (
            <li key={item.chave} className="rounded-lg border bg-card p-4 animate-entrar" aria-label={`Item ${indice + 1}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-rotulo font-medium">
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted text-apoio font-semibold tabular-nums">
                    {indice + 1}
                  </span>
                  Item {indice + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => aoRemover(item.chave)}
                  disabled={itens.length === 1}
                  aria-label={`Remover item ${indice + 1}`}
                  title={itens.length === 1 ? 'A requisição precisa de ao menos um item' : undefined}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
                <Campo id={`${prefixo}-componente`} rotulo="Hemocomponente" erro={doItem.componente}>
                  {(props) => (
                    <Select
                      {...props}
                      value={item.componente}
                      onChange={(evento) => aoMudar(item.chave, { componente: evento.target.value as TipoComponente })}
                    >
                      {COMPONENTES.map((opcao) => (
                        <option key={opcao.valor} value={opcao.valor}>
                          {opcao.rotulo}
                        </option>
                      ))}
                    </Select>
                  )}
                </Campo>

                <Campo id={`${prefixo}-quantidade`} rotulo="Quantidade" erro={doItem.quantidade}>
                  {(props) => (
                    <div className="flex">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-r-none border-r-0"
                        onClick={() => aoMudar(item.chave, { quantidade: String(Math.max(1, (Number(item.quantidade) || 0) - 1)) })}
                        aria-label={`Diminuir quantidade do item ${indice + 1}`}
                      >
                        <Minus />
                      </Button>
                      <Input
                        {...props}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={item.quantidade}
                        onChange={(evento) => aoMudar(item.chave, { quantidade: evento.target.value })}
                        className="rounded-none text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-l-none border-l-0"
                        onClick={() => aoMudar(item.chave, { quantidade: String((Number(item.quantidade) || 0) + 1) })}
                        aria-label={`Aumentar quantidade do item ${indice + 1}`}
                      >
                        <Plus />
                      </Button>
                    </div>
                  )}
                </Campo>
              </div>

              <Campo id={`${prefixo}-tipo`} rotulo="Tipo sanguíneo" erro={doItem.tipoSanguineo} className="mt-4">
                {(props) => (
                  <SeletorDeTipoSanguineo
                    id={props.id}
                    nome={`${prefixo}-tipo`}
                    valor={item.tipoSanguineo}
                    aoMudar={(tipo) => aoMudar(item.chave, { tipoSanguineo: tipo })}
                  />
                )}
              </Campo>
            </li>
          )
        })}
      </ol>

      <Button type="button" variant="outline" className="w-full border-dashed" onClick={aoAdicionar}>
        <Plus />
        Adicionar outro hemocomponente
      </Button>
    </div>
  )
}
