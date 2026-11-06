import { cn } from '@/lib/utils'

/**
 * Marca do BLOODELL: uma etiqueta de bolsa (canto cortado, como o rotulo
 * colado na bolsa) com uma gota vazada. Sem a gota solta e sem vermelho: a
 * cor da marca e a violeta, que nao se confunde com nenhum estado operacional.
 */
export function SimboloDaMarca({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn('size-7', className)} aria-hidden="true">
      <path
        fill="var(--sidebar-indicator)"
        d="M6 2h11.2c.5 0 1 .2 1.4.6l6.8 6.8c.4.4.6.9.6 1.4V22a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z"
      />
      <path fill="var(--sidebar)" opacity=".28" d="M17.2 2c.5 0 1 .2 1.4.6l6.8 6.8c.4.4.6.9.6 1.4H19a1.8 1.8 0 0 1-1.8-1.8V2Z" />
      <path
        fill="var(--sidebar)"
        d="M13.8 8.2c-.2-.3-.6-.3-.8 0-1.9 2.6-4.2 5.5-4.2 8.2a4.6 4.6 0 0 0 9.2 0c0-2.7-2.3-5.6-4.2-8.2Z"
      />
    </svg>
  )
}

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <SimboloDaMarca />
      <span className="text-[1.0625rem] font-semibold tracking-tight">Bloodell</span>
    </span>
  )
}
