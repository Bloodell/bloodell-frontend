'use client'

import { Building2, Hospital, Save, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Alerta } from '@/components/form/alerta'
import { useEnvio } from '@/components/form/use-envio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Perfil, Unidade, UsuarioAtual, VinculosDeUnidade } from '@/lib/api/tipos'
import { plural } from '@/lib/formatos'
import { cn } from '@/lib/utils'
import { substituirVinculos } from './usuarios-api'

/** Tipo de unidade que costuma fazer sentido para cada perfil (so sugestao). */
const TIPO_SUGERIDO: Record<Perfil, Unidade['tipo'] | 'AMBOS' | null> = {
  OPERADOR_HEMOCENTRO: 'HEMOCENTRO',
  USUARIO_HOSPITAL: 'HOSPITAL',
  LOGISTICA: 'AMBOS',
  ADMIN: null,
}

function iguais(a: Set<number>, b: Set<number>) {
  return a.size === b.size && [...a].every((id) => b.has(id))
}

/**
 * Quais unidades a conta enxerga. O backend substitui o conjunto inteiro
 * (PUT); conjunto vazio revoga todo acesso. ADMIN e global e ignora vinculos.
 */
export function EditorDeVinculos({ usuario }: { usuario: UsuarioAtual }) {
  const vinculos = useRecurso<VinculosDeUnidade>(`/usuarios/${usuario.id}/unidades`)
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const hospitais = useRecurso<Unidade[]>('/hospitais')

  if (vinculos.erro || hemocentros.erro || hospitais.erro) {
    const recarregar = () => [vinculos, hemocentros, hospitais].forEach((recurso) => recurso.recarregar())
    return (
      <Alerta tipo="erro" titulo="Não foi possível carregar os vínculos">
        {vinculos.erro ?? hemocentros.erro ?? hospitais.erro}{' '}
        <button type="button" className="font-medium underline underline-offset-2" onClick={recarregar}>
          Tentar novamente
        </button>
      </Alerta>
    )
  }

  if (!vinculos.dados || !hemocentros.dados || !hospitais.dados) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((indice) => (
          <Skeleton key={indice} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <SeletorDeUnidades
      // Remonta quando os vinculos salvos mudam, para partir do estado do servidor.
      key={[...vinculos.dados.unidadeIds].sort().join(',')}
      usuario={usuario}
      salvos={vinculos.dados.unidadeIds}
      unidades={[...hemocentros.dados, ...hospitais.dados]}
      aoSalvar={vinculos.recarregar}
    />
  )
}

function SeletorDeUnidades({
  usuario,
  salvos,
  unidades,
  aoSalvar,
}: {
  usuario: UsuarioAtual
  salvos: number[]
  unidades: Unidade[]
  aoSalvar: () => void
}) {
  const [marcadas, setMarcadas] = useState(() => new Set(salvos))
  const [busca, setBusca] = useState('')
  const envio = useEnvio()

  const original = new Set(salvos)
  const alterado = !iguais(marcadas, original)
  const sugestao = TIPO_SUGERIDO[usuario.perfil]
  const termo = busca.trim().toLocaleLowerCase('pt-BR')
  const visiveis = termo
    ? unidades.filter((unidade) => `${unidade.nome} ${unidade.cidade} ${unidade.uf}`.toLocaleLowerCase('pt-BR').includes(termo))
    : unidades
  const desconhecidos = salvos.filter((id) => !unidades.some((unidade) => unidade.id === id))

  function alternar(id: number) {
    setMarcadas((atuais) => {
      const proximas = new Set(atuais)
      if (proximas.has(id)) proximas.delete(id)
      else proximas.add(id)
      return proximas
    })
  }

  async function salvar() {
    const resposta = await envio.executar(
      () => substituirVinculos(usuario.id, [...marcadas]),
      'Não foi possível salvar os vínculos.',
    )
    if (resposta) {
      toast.success('Vínculos salvos', {
        description:
          resposta.unidadeIds.length === 0
            ? `${usuario.nome} não acessa nenhuma unidade agora.`
            : `${usuario.nome} acessa ${plural(resposta.unidadeIds.length, 'unidade')}.`,
      })
      aoSalvar()
    }
  }

  if (usuario.perfil === 'ADMIN') {
    return (
      <Alerta tipo="info" titulo="Administradores têm acesso global">
        O backend ignora vínculos para o perfil Administrador. Para restringir esta conta, troque o perfil primeiro.
      </Alerta>
    )
  }

  const grupos: { tipo: Unidade['tipo']; titulo: string; icone: typeof Building2 }[] = [
    { tipo: 'HEMOCENTRO', titulo: 'Hemocentros', icone: Building2 },
    { tipo: 'HOSPITAL', titulo: 'Hospitais', icone: Hospital },
  ]

  return (
    <div className="space-y-4">
      {unidades.length > 6 && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            placeholder="Buscar por nome ou cidade"
            aria-label="Buscar unidade"
            className="h-8 pl-9 text-rotulo"
          />
        </div>
      )}

      {unidades.length === 0 && (
        <p className="text-rotulo text-muted-foreground">Nenhuma unidade cadastrada ainda. Cadastre em Unidades.</p>
      )}

      {grupos.map(({ tipo, titulo, icone: Icone }) => {
        const doGrupo = visiveis.filter((unidade) => unidade.tipo === tipo)
        if (doGrupo.length === 0) return null
        const sugerido = sugestao === tipo || sugestao === 'AMBOS'
        return (
          <fieldset key={tipo} className="space-y-1.5">
            <legend className="mb-1.5 flex items-center gap-2 text-rotulo font-medium">
              <Icone className="size-4 text-muted-foreground" aria-hidden="true" />
              {titulo}
              {sugerido && (
                <span className="rounded bg-secondary px-1.5 py-px text-apoio font-medium text-secondary-foreground">
                  comum para este perfil
                </span>
              )}
            </legend>
            {doGrupo.map((unidade) => {
              const marcada = marcadas.has(unidade.id)
              return (
                <label
                  key={unidade.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                    marcada && 'border-primary/40 bg-secondary/50 hover:bg-secondary/50',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternar(unidade.id)}
                    className="size-4 shrink-0 accent-[var(--primary)]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-rotulo font-medium">{unidade.nome}</span>
                    <span className="block text-apoio text-muted-foreground">
                      {unidade.cidade}/{unidade.uf}
                    </span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        )
      })}

      {termo && visiveis.length === 0 && <p className="text-rotulo text-muted-foreground">Nenhuma unidade com “{busca}”.</p>}

      {desconhecidos.length > 0 && (
        <p className="text-apoio text-muted-foreground">
          {plural(desconhecidos.length, 'vínculo')} com unidade que não aparece nas listas (IDs {desconhecidos.join(', ')}).
          Eles são mantidos ao salvar.
        </p>
      )}

      {envio.erro && <Alerta tipo="erro" titulo="A API recusou os vínculos">{envio.erro}</Alerta>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-apoio text-muted-foreground" aria-live="polite">
          {marcadas.size === 0 ? (
            <span className="font-medium text-atencao">Sem vínculos: a conta não verá nenhum dado de unidade.</span>
          ) : (
            <>
              {plural(marcadas.size, 'unidade marcada', 'unidades marcadas')}
              {alterado && ' · alterações não salvas'}
            </>
          )}
        </p>
        <Button size="sm" onClick={salvar} carregando={envio.enviando} disabled={!alterado}>
          {!envio.enviando && <Save />}
          Salvar vínculos
        </Button>
      </div>
    </div>
  )
}
