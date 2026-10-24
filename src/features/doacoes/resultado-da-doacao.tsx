import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Doacao } from '@/lib/api/tipos'
import { data, rotulo, tomDoEstadoDaBolsa } from '@/lib/formatos'
import { cn } from '@/lib/utils'

/** Confirmacao da escrita: as bolsas que a API acabou de gerar. */
export function ResultadoDaDoacao({ doacao }: { doacao: Doacao }) {
  return (
    <Card className="overflow-hidden animate-entrar">
      <div className="flex items-start gap-3 border-b bg-emerald-500/5 px-6 py-4">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">
            Doação <span className="font-mono">{doacao.codigo}</span> registrada
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {doacao.tipoSanguineo} · {doacao.volumeMl} ml · {doacao.bolsasGeradas.length} bolsa(s) no estoque
          </p>
        </div>
      </div>
      <ul className="divide-y">
        {doacao.bolsasGeradas.map((bolsa) => (
          <li key={bolsa.id} className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              <p className="truncate font-mono text-[13px]">{bolsa.codigo}</p>
              <p className="text-xs text-muted-foreground">
                {rotulo(bolsa.componente)} · vence {data(bolsa.dataValidade)}
              </p>
            </div>
            <Badge tom={tomDoEstadoDaBolsa(bolsa.status)}>{rotulo(bolsa.status)}</Badge>
          </li>
        ))}
      </ul>
      <div className="border-t px-6 py-3">
        <Link href="/estoque" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-3')}>
          Ver no estoque
          <ArrowRight />
        </Link>
      </div>
    </Card>
  )
}
