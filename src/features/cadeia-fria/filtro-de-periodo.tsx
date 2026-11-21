'use client'

import { AlertCircle, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PERIODO_VAZIO, validarPeriodo, type Periodo } from './telemetria-api'

/** De/ate em hora local; so aplica ao confirmar, para nao consultar a cada tecla. */
export function FiltroDePeriodo({ periodo, aoAplicar }: { periodo: Periodo; aoAplicar: (periodo: Periodo) => void }) {
  const [rascunho, setRascunho] = useState<Periodo>(periodo)
  const [erro, setErro] = useState<string | null>(null)
  const ativo = Boolean(periodo.de || periodo.ate)

  function aplicar(evento: FormEvent) {
    evento.preventDefault()
    const problema = validarPeriodo(rascunho)
    setErro(problema)
    if (!problema) aoAplicar(rascunho)
  }

  function limpar() {
    setRascunho(PERIODO_VAZIO)
    setErro(null)
    aoAplicar(PERIODO_VAZIO)
  }

  return (
    <form onSubmit={aplicar} noValidate className="space-y-2">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="periodo-de" className="text-apoio text-muted-foreground">
            De
          </Label>
          <Input
            id="periodo-de"
            type="datetime-local"
            value={rascunho.de}
            onChange={(evento) => setRascunho((atual) => ({ ...atual, de: evento.target.value }))}
            className="h-8 w-auto text-rotulo tabular-nums"
            aria-invalid={erro ? true : undefined}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="periodo-ate" className="text-apoio text-muted-foreground">
            Até
          </Label>
          <Input
            id="periodo-ate"
            type="datetime-local"
            value={rascunho.ate}
            onChange={(evento) => setRascunho((atual) => ({ ...atual, ate: evento.target.value }))}
            className="h-8 w-auto text-rotulo tabular-nums"
            aria-invalid={erro ? true : undefined}
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Aplicar período
        </Button>
        {ativo && (
          <Button type="button" variant="ghost" size="sm" onClick={limpar}>
            <X />
            Todo o histórico
          </Button>
        )}
      </div>
      {erro && (
        <p role="alert" className="flex items-center gap-1.5 text-apoio text-critico">
          <AlertCircle className="size-3.5" aria-hidden="true" />
          {erro}
        </p>
      )}
    </form>
  )
}
