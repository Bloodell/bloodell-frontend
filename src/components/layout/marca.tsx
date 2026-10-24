import { cn } from '@/lib/utils'

export function Marca({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span className="flex size-7 items-center justify-center rounded-lg bg-white shadow-sm">
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
          <path
            fill="var(--brand)"
            d="M12 2.5c-.3 0-.6.1-.8.4C8.6 6.4 5.5 10.6 5.5 14.5a6.5 6.5 0 0 0 13 0c0-3.9-3.1-8.1-5.7-11.6a1 1 0 0 0-.8-.4Z"
          />
          <path
            fill="none"
            stroke="white"
            strokeOpacity=".9"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M9 15.2a3 3 0 0 0 3 2.8"
          />
        </svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">Bloodell</span>
    </span>
  )
}
