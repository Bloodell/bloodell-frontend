import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { SCRIPT_DO_TEMA } from '@/components/layout/alternar-tema'
import { BarraSuperior } from '@/components/layout/barra-superior'
import { Lateral } from '@/components/layout/lateral'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: { default: 'Bloodell', template: '%s · Bloodell' },
  description: 'Gestão, distribuição e monitoramento de hemocomponentes na rede de sangue (dados sintéticos).',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f8f6' },
    { media: '(prefers-color-scheme: dark)', color: '#0a1410' },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DO_TEMA }} />
      </head>
      <body className="min-h-dvh font-sans">
        <a
          href="#conteudo"
          className="fixed top-2 left-2 z-50 -translate-y-16 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground transition-transform focus:translate-y-0"
        >
          Pular para o conteúdo
        </a>
        <Lateral />
        <div className="lg:pl-60">
          <BarraSuperior />
          <main id="conteudo" className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: '!rounded-lg !border !border-border !bg-popover !text-popover-foreground !shadow-lg !font-sans',
              description: '!text-muted-foreground',
            },
          }}
        />
      </body>
    </html>
  )
}
