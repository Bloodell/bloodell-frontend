import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Aviso obrigatorio em toda tela que mostra dado do dominio. Discreto, mas
 * sempre presente: os dados sao sinteticos e as regras de compatibilidade sao
 * didaticas.
 */
export function AvisoAcademico({ complemento, className }: { complemento?: string; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2.5 rounded-lg border border-dashed px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground',
        className,
      )}
    >
      <FlaskConical className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground">Projeto acadêmico.</span> Dados sintéticos, sem informação real de
        doador ou paciente. As regras de compatibilidade são didáticas e não constituem orientação clínica.
        {complemento && <> {complemento}</>}
      </span>
    </p>
  )
}
