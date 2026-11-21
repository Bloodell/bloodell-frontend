'use client'

import { ChevronRight, RotateCw, ShieldAlert, UserPlus, UsersRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Paginacao } from '@/components/data-table/paginacao'
import { TabelaDeDados, type Coluna } from '@/components/data-table/tabela-de-dados'
import { EstadoVazio } from '@/components/feedback/estados'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator, Sheet } from '@/components/ui/sheet'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Pagina, UsuarioAtual } from '@/lib/api/tipos'
import { useSessao } from '../autenticacao/provedor-de-sessao'
import { iniciais, podeGerenciarUsuarios, rotuloDoPerfil } from '../autenticacao/sessao'
import { EditorDeVinculos } from './editor-de-vinculos'
import { FormularioDeUsuario } from './formulario-de-usuario'
import { caminhoDaListaDeUsuarios } from './usuarios-api'

export function PaginaDeUsuarios() {
  const { usuario, demonstracao } = useSessao()

  if (!podeGerenciarUsuarios(usuario, demonstracao)) {
    return (
      <EstadoVazio
        icone={ShieldAlert}
        titulo={demonstracao ? 'Contas não existem na demonstração' : 'Área restrita a administradores'}
        descricao={
          demonstracao
            ? 'A demonstração roda sem autenticação. Usuários e vínculos existem só na versão de operação.'
            : 'Peça a um administrador da rede para criar ou ajustar contas.'
        }
        className="py-24"
      />
    )
  }

  return <GestaoDeUsuarios />
}

function GestaoDeUsuarios() {
  const sessao = useSessao()
  const router = useRouter()
  const [pagina, setPagina] = useState(0)
  const [cadastrando, setCadastrando] = useState(false)
  const [selecionado, setSelecionado] = useState<UsuarioAtual | null>(null)
  const usuarios = useRecurso<Pagina<UsuarioAtual>>(caminhoDaListaDeUsuarios(pagina))

  async function aoSalvar(salvo: UsuarioAtual, criado: boolean) {
    usuarios.recarregar()
    if (criado) {
      toast.success(`${salvo.nome} cadastrado`, { description: 'Agora vincule as unidades que a conta deve enxergar.' })
      setCadastrando(false)
      setSelecionado(salvo)
      return
    }
    toast.success('Alterações salvas')
    setSelecionado(salvo)
    // Mexeu na propria conta: o perfil vale pelo que o servidor diz agora.
    if (salvo.id === sessao.usuario?.id) {
      await sessao.atualizarUsuario()
      if (salvo.perfil !== 'ADMIN') {
        toast.info('Você não é mais administrador', { description: 'A área de usuários foi fechada para esta conta.' })
        router.replace('/')
      }
    }
  }

  const colunas: Coluna<UsuarioAtual>[] = [
    {
      id: 'usuario',
      cabecalho: 'Usuário',
      celula: (linha) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-apoio font-semibold">
            {iniciais(linha.nome)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">
              {linha.nome}
              {linha.id === sessao.usuario?.id && <span className="ml-1.5 text-apoio font-normal text-muted-foreground">(você)</span>}
            </p>
            <p className="truncate text-apoio text-muted-foreground">{linha.email}</p>
          </div>
        </div>
      ),
      esqueleto: 'w-48',
    },
    {
      id: 'perfil',
      cabecalho: 'Perfil',
      celula: (linha) => (
        <Badge tom={linha.perfil === 'ADMIN' ? 'info' : 'neutro'} ponto={false}>
          {rotuloDoPerfil(linha.perfil)}
        </Badge>
      ),
      esqueleto: 'w-28',
    },
    {
      id: 'id',
      cabecalho: 'ID',
      celula: (linha) => <span className="font-mono text-rotulo text-muted-foreground">#{linha.id}</span>,
      className: 'hidden sm:table-cell w-20',
      esqueleto: 'w-10',
    },
    {
      id: 'acao',
      cabecalho: <span className="sr-only">Ação</span>,
      celula: (linha) => (
        <Button variant="ghost" size="sm" onClick={() => setSelecionado(linha)} aria-label={`Gerenciar ${linha.nome}`}>
          Gerenciar
          <ChevronRight />
        </Button>
      ),
      className: 'w-32 text-right',
      esqueleto: 'ml-auto w-20',
    },
  ]

  const resposta = usuarios.dados

  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Usuários"
        descricao="Contas da equipe, perfil de cada uma e as unidades que ela enxerga. Não há cadastro público nem troca de senha pela interface."
        acoes={
          <>
            <Button variant="outline" size="sm" onClick={usuarios.recarregar}>
              <RotateCw />
              Atualizar
            </Button>
            <Button size="sm" onClick={() => setCadastrando(true)}>
              <UserPlus />
              Novo usuário
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <TabelaDeDados
          colunas={colunas}
          linhas={resposta?.content ?? []}
          chave={(linha) => linha.id}
          carregando={usuarios.carregando}
          erro={usuarios.erro}
          aoTentarNovamente={usuarios.recarregar}
          vazio={
            <EstadoVazio
              icone={UsersRound}
              titulo={pagina > 0 ? 'Esta página ficou vazia' : 'Nenhum usuário cadastrado'}
              descricao={pagina > 0 ? 'Volte para a primeira página.' : 'Cadastre a primeira conta da equipe.'}
              acao={
                pagina > 0 ? (
                  <Button variant="outline" size="sm" onClick={() => setPagina(0)}>
                    Ir para a primeira página
                  </Button>
                ) : undefined
              }
            />
          }
          rodape={
            resposta && (
              <Paginacao
                pagina={pagina}
                totalPaginas={resposta.totalPages}
                totalItens={resposta.totalElements}
                tamanho={resposta.size}
                aoMudar={setPagina}
              />
            )
          }
        />
      </Card>

      <Sheet
        aberto={cadastrando}
        aoMudar={setCadastrando}
        titulo="Novo usuário"
        descricao="A pessoa entra com este e-mail e a senha inicial."
        className="max-w-lg"
      >
        <FormularioDeUsuario usuario={null} aoSalvar={aoSalvar} />
      </Sheet>

      <Sheet
        aberto={selecionado !== null}
        aoMudar={(aberto) => !aberto && setSelecionado(null)}
        titulo={selecionado?.nome ?? ''}
        descricao={selecionado ? `${rotuloDoPerfil(selecionado.perfil)} · ${selecionado.email}` : undefined}
        className="max-w-lg"
      >
        {selecionado && (
          <div className="space-y-8">
            <section aria-labelledby="titulo-dados" className="space-y-4">
              <h3 id="titulo-dados" className="text-subtitulo font-semibold">
                Dados da conta
              </h3>
              <FormularioDeUsuario key={`${selecionado.id}-${selecionado.perfil}-${selecionado.email}`} usuario={selecionado} aoSalvar={aoSalvar} />
            </section>
            <Separator />
            <section aria-labelledby="titulo-vinculos" className="space-y-4">
              <div>
                <h3 id="titulo-vinculos" className="text-subtitulo font-semibold">
                  Unidades vinculadas
                </h3>
                <p className="mt-1 text-rotulo text-muted-foreground">
                  A conta só enxerga estoque, requisições, entregas e veículos dessas unidades.
                </p>
              </div>
              <EditorDeVinculos key={`${selecionado.id}-${selecionado.perfil}`} usuario={selecionado} />
            </section>
          </div>
        )}
      </Sheet>
    </div>
  )
}
