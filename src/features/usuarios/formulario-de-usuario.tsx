'use client'

import { Eye, EyeOff, Save, UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Alerta } from '@/components/form/alerta'
import { Campo } from '@/components/form/campo'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Perfil, UsuarioAtual } from '@/lib/api/tipos'
import { cn } from '@/lib/utils'
import { PERFIS } from '../autenticacao/sessao'
import {
  bytesUtf8,
  cadastrarUsuario,
  diferencasDoUsuario,
  LIMITES,
  validarCadastro,
  validarDados,
  atualizarUsuario,
  type ErrosDeUsuario,
} from './usuarios-api'

/** Os quatro perfis como cartoes de radio, com o que cada um faz. */
export function SeletorDePerfil({
  valor,
  aoMudar,
  invalido,
  idDaMensagem,
}: {
  valor: Perfil | ''
  aoMudar: (perfil: Perfil) => void
  invalido?: boolean
  idDaMensagem?: string
}) {
  return (
    <div role="radiogroup" aria-label="Perfil" aria-describedby={idDaMensagem} className="grid gap-2 sm:grid-cols-2">
      {PERFIS.map((perfil) => {
        const marcado = valor === perfil.valor
        return (
          <label
            key={perfil.valor}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-[border-color,background-color] hover:bg-muted/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
              marcado && 'border-primary/50 bg-secondary/60 hover:bg-secondary/60',
              invalido && !valor && 'border-critico/50',
            )}
          >
            <input
              type="radio"
              name="perfil"
              className="sr-only"
              value={perfil.valor}
              checked={marcado}
              onChange={() => aoMudar(perfil.valor)}
            />
            <span
              className={cn(
                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input',
                marcado && 'border-primary',
              )}
              aria-hidden="true"
            >
              <span className={cn('size-2 rounded-full bg-primary transition-transform', marcado ? 'scale-100' : 'scale-0')} />
            </span>
            <span className="grid gap-0.5">
              <span className="text-rotulo font-medium">{perfil.rotulo}</span>
              <span className="text-apoio text-muted-foreground">{perfil.descricao}</span>
            </span>
          </label>
        )
      })}
    </div>
  )
}

interface Valores {
  nome: string
  email: string
  perfil: Perfil | ''
  senha: string
}

/** Cadastro (com senha inicial) ou edicao (nome, e-mail e perfil; senha nunca). */
export function FormularioDeUsuario({
  usuario,
  aoSalvar,
}: {
  /** null = cadastro. */
  usuario: UsuarioAtual | null
  aoSalvar: (usuario: UsuarioAtual, criado: boolean) => void
}) {
  const editando = usuario !== null
  const [valores, setValores] = useState<Valores>(
    usuario
      ? { nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, senha: '' }
      : { nome: '', email: '', perfil: '', senha: '' },
  )
  const [tentouEnviar, setTentouEnviar] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const envio = useEnvio()

  const validacao: ErrosDeUsuario = editando ? validarDados(valores) : validarCadastro(valores)
  const erros: ErrosDeUsuario = tentouEnviar ? { ...validacao, ...envio.errosDaApi } : envio.errosDaApi
  const mudancas = usuario && valores.perfil ? diferencasDoUsuario(usuario, { ...valores, perfil: valores.perfil }) : {}
  const semMudancas = editando && Object.keys(mudancas).length === 0

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setTentouEnviar(true)
    if (Object.keys(validacao).length > 0 || !valores.perfil) return
    if (semMudancas) return

    const salvo = await envio.executar(
      () =>
        usuario
          ? atualizarUsuario(usuario.id, mudancas)
          : cadastrarUsuario({
              nome: valores.nome.trim(),
              email: valores.email.trim(),
              perfil: valores.perfil as Perfil,
              senha: valores.senha,
            }),
      editando ? 'Não foi possível salvar as alterações.' : 'Não foi possível cadastrar o usuário.',
    )
    if (salvo) {
      setTentouEnviar(false)
      if (!editando) setValores({ nome: '', email: '', perfil: '', senha: '' })
      aoSalvar(salvo, !editando)
    }
  }

  const bytesDaSenha = bytesUtf8(valores.senha)

  return (
    <form onSubmit={enviar} noValidate className="space-y-5">
      <Campo id={editando ? 'usuario-nome' : 'novo-nome'} rotulo="Nome" erro={erros.nome}>
        {(props) => (
          <Input
            {...props}
            autoComplete="off"
            maxLength={LIMITES.nome}
            value={valores.nome}
            onChange={(evento) => mudar('nome', evento.target.value)}
          />
        )}
      </Campo>

      <Campo
        id={editando ? 'usuario-email' : 'novo-email'}
        rotulo="E-mail"
        erro={erros.email}
        ajuda={editando ? undefined : 'É o login da pessoa. Precisa ser único na rede.'}
      >
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="off"
            spellCheck={false}
            maxLength={LIMITES.email}
            value={valores.email}
            onChange={(evento) => mudar('email', evento.target.value)}
          />
        )}
      </Campo>

      <Campo id={editando ? 'usuario-perfil' : 'novo-perfil'} rotulo="Perfil" erro={erros.perfil}>
        {(props) => (
          <SeletorDePerfil
            valor={valores.perfil}
            aoMudar={(perfil) => mudar('perfil', perfil)}
            invalido={Boolean(erros.perfil)}
            idDaMensagem={props['aria-describedby']}
          />
        )}
      </Campo>

      {!editando && (
        <Campo
          id="novo-senha"
          rotulo="Senha inicial"
          erro={erros.senha}
          ajuda={
            <>
              Pelo menos {LIMITES.senhaMinima} caracteres.{' '}
              {valores.senha && (
                <span className="tabular-nums">
                  {valores.senha.length} caracteres · {bytesDaSenha}/{LIMITES.senhaMaximaBytes} bytes
                </span>
              )}
            </>
          }
        >
          {(props) => (
            <div className="relative">
              <Input
                {...props}
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                value={valores.senha}
                onChange={(evento) => mudar('senha', evento.target.value)}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((atual) => !atual)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          )}
        </Campo>
      )}

      {envio.erro && (
        <Alerta tipo="erro" titulo={editando ? 'A API recusou a alteração' : 'A API recusou o cadastro'}>
          {envio.erro}
        </Alerta>
      )}

      <div className="flex items-center justify-end gap-3">
        {editando && semMudancas && <p className="mr-auto text-apoio text-muted-foreground">Nenhuma alteração.</p>}
        <Button type="submit" carregando={envio.enviando} disabled={semMudancas}>
          {!envio.enviando && (editando ? <Save /> : <UserPlus />)}
          {editando ? 'Salvar alterações' : 'Cadastrar usuário'}
        </Button>
      </div>
    </form>
  )
}
