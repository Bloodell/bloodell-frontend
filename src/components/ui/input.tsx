import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export const estiloDeCampo =
  'h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm shadow-xs transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-critico aria-invalid:ring-critico/20'

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn(estiloDeCampo, className)} {...props} />
}
