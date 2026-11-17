'use client'

import { ArrowRight, Eye, EyeOff, FlaskConical, LockKeyhole } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { Marca } from '@/components/layout/marca'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErroDaApi } from '@/lib/api/cliente'
import { PainelDaRede } from './painel-da-rede'
import { useSessao } from './provedor-de-sessao'
import { caminhoDeRetornoSeguro } from './sessao'

/**
 * Foto opcional do painel lateral, servida de /public. Enquanto for null, o
 * painel mostra o desenho da rede (vetorial, sem arquivo).
 */
const IMAGEM_DO_LOGIN: { caminho: string; descricao: string } | null = null

const LIMITE_DA_SENHA_EM_BYTES = 72

function validar(email: string, senha: string) {
  const erros: { email?: string; senha?: string } = {}
  if (!email.trim()) erros.email = 'Informe o e-mail da sua conta.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) erros.email = 'Confira o e-mail: falta algo como nome@dominio.'
  if (!senha) erros.senha = 'Informe a senha.'
  else if (new TextEncoder().encode(senha).length > LIMITE_DA_SENHA_EM_BYTES) erros.senha = 'Senha maior que o permitido.'
  return erros
}

function mensagemDaFalha(falha: unknown): string {
  if (!(falha instanceof ErroDaApi)) return 'Algo deu errado ao entrar. Tente novamente.'
  if (falha.status === 0) return 'Não foi possível falar com a API. Confira a conexão e tente novamente.'
  if (falha.status === 401 || falha.status === 400) return 'E-mail ou senha incorretos.'
  if (falha.status === 403 || falha.status === 404)
    return 'Este servidor está sem autenticação habilitada. Use o build de demonstração ou ligue a autenticação no backend.'
  if (falha.status === 429) return 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.'
  return falha.mensagemAmigavel
}

export function PaginaDeLogin() {
  const sessao = useSessao()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  // Lidos no cliente (a pagina e exportada estaticamente; ver Suspense em app/login).
  const parametros = useSearchParams()
  const destino = caminhoDeRetornoSeguro(parametros.get('voltar'))
  const expirou = parametros.get('motivo') === 'expirada'

  useEffect(() => {
    if (sessao.estado === 'autenticada') router.replace(destino)
  }, [sessao.estado, destino, router])

  const erros = tentouEnviar ? validar(email, senha) : {}
  const enviando = sessao.estado === 'autenticando'

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    setFalha(null)
    if (Object.keys(validar(email, senha)).length > 0) return
    try {
      await sessao.entrar(email, senha)
      setSenha('')
    } catch (erro) {
      setFalha(mensagemDaFalha(erro))
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main id="conteudo" className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <Marca className="text-foreground" />

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="text-titulo font-semibold tracking-tight text-balance">Entrar no Bloodell</h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            Use a conta criada pelo administrador da rede. Cada conta vê só as unidades às quais está vinculada.
          </p>

          {sessao.demonstracao ? (
            <div className="mt-8 space-y-4">
              <Alerta tipo="info" titulo="Esta é a versão de demonstração">
                Ela roda sem login, contra um backend com dados sintéticos. Contas e permissões existem só na versão de
                operação.
              </Alerta>
              <Link href="/" className={buttonVariants({ className: 'w-full' })}>
                Abrir a demonstração
                <ArrowRight />
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} noValidate className="mt-8 space-y-5">
              {expirou && !falha && (
                <Alerta tipo="info" titulo="Sua sessão terminou">
                  Por segurança, o acesso expira depois de um tempo. Entre de novo para continuar de onde parou.
                </Alerta>
              )}

              <Campo id="email" rotulo="E-mail" erro={erros.email}>
                {(props) => (
                  <Input
                    {...props}
                    type="email"
                    autoComplete="username"
                    inputMode="email"
                    autoFocus
                    spellCheck={false}
                    value={email}
                    onChange={(evento) => setEmail(evento.target.value)}
                    placeholder="nome@hemocentro.org"
                    className="h-10"
                  />
                )}
              </Campo>

              <Campo id="senha" rotulo="Senha" erro={erros.senha}>
                {(props) => (
                  <div className="relative">
                    <Input
                      {...props}
                      type={mostrarSenha ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={senha}
                      onChange={(evento) => setSenha(evento.target.value)}
                      className="h-10 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((atual) => !atual)}
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      aria-pressed={mostrarSenha}
                    >
                      {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                )}
              </Campo>

              {falha && (
                <Alerta tipo="erro" titulo="Não foi possível entrar">
                  {falha}
                </Alerta>
              )}

              <Button type="submit" size="lg" className="w-full" carregando={enviando}>
                {enviando ? 'Entrando…' : 'Entrar'}
                {!enviando && <ArrowRight />}
              </Button>

              <p className="flex items-start gap-2 text-apoio text-muted-foreground">
                <LockKeyhole className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                <span>
                  A sessão fica só nesta aba: recarregar a página ou fechar o navegador pede login de novo. Esqueceu a
                  senha? Fale com o administrador da rede.
                </span>
              </p>
            </form>
          )}
        </div>

        <p className="flex items-center gap-2 text-apoio text-muted-foreground">
          <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
          Projeto acadêmico · CESAR School 2026.2 · dados sintéticos
        </p>
      </main>

      <PainelDaRede imagem={IMAGEM_DO_LOGIN} />
    </div>
  )
}
