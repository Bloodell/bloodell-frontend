interface PropriedadesDoEstado {
  carregando?: boolean
  erro?: string | null
  vazio?: boolean
  mensagemVazio?: string
  aoTentarNovamente?: () => void
  children: React.ReactNode
}

/**
 * Estados de carregando, erro e vazio, em um lugar so.
 *
 * Toda tela que consome a API passa por aqui. Assim ninguem esquece de tratar
 * um dos tres casos -- e a tela nunca mostra numero inventado enquanto espera.
 */
export function Estado({
  carregando,
  erro,
  vazio,
  mensagemVazio = 'Nada para mostrar ainda.',
  aoTentarNovamente,
  children,
}: PropriedadesDoEstado) {
  if (carregando) {
    return (
      <div className="estado" role="status" aria-live="polite">
        <div className="estado__titulo">Carregando…</div>
        <div>Consultando a API do Bloodell.</div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="aviso aviso--erro" role="alert">
        <strong>Não foi possível carregar.</strong>
        <div style={{ marginTop: 4 }}>{erro}</div>
        {aoTentarNovamente && (
          <button
            type="button"
            className="botao botao--secundario"
            style={{ marginTop: 12 }}
            onClick={aoTentarNovamente}
          >
            Tentar novamente
          </button>
        )}
      </div>
    )
  }

  if (vazio) {
    return (
      <div className="estado">
        <div className="estado__titulo">Sem dados</div>
        <div>{mensagemVazio}</div>
      </div>
    )
  }

  return <>{children}</>
}
