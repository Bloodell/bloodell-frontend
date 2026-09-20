import { NavLink, Outlet } from 'react-router-dom'

const PAGINAS = [
  { caminho: '/', rotulo: 'Painel', fim: true },
  { caminho: '/estoque', rotulo: 'Estoque' },
  { caminho: '/doacoes', rotulo: 'Registrar doação' },
  { caminho: '/requisicoes', rotulo: 'Requisições' },
  { caminho: '/algoritmos', rotulo: 'Estruturas (AED)' },
  { caminho: '/unidades', rotulo: 'Unidades' },
]

function Gota() {
  return (
    <svg className="lateral__gota" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5c3.6 4.3 7 8.2 7 12a7 7 0 1 1-14 0c0-3.8 3.4-7.7 7-12z"
        fill="#dc2626"
        stroke="#ffffff"
        strokeWidth="1.2"
      />
    </svg>
  )
}

export function Layout() {
  return (
    <div className="aplicacao">
      <nav className="lateral" aria-label="Navegação principal">
        <div>
          <div className="lateral__marca">
            <Gota />
            BLOODELL
          </div>
          <div className="lateral__legenda">
            Gestão, distribuição e monitoramento de hemocomponentes · dados sintéticos
          </div>
        </div>

        <div className="navegacao">
          {PAGINAS.map((pagina) => (
            <NavLink
              key={pagina.caminho}
              to={pagina.caminho}
              end={pagina.fim}
              className={({ isActive }) =>
                `navegacao__item${isActive ? ' navegacao__item--ativo' : ''}`
              }
            >
              {pagina.rotulo}
            </NavLink>
          ))}
        </div>

        <div className="lateral__legenda" style={{ marginTop: 'auto' }}>
          CESAR School · ADS 3º semestre · Projeto integrador
          <br />
          Unidade 1 — sem FEFO, sem matriz ABO/Rh e sem rota
        </div>
      </nav>

      <div className="conteudo">
        <Outlet />
      </div>
    </div>
  )
}

export function Cabecalho({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao: string
  acoes?: React.ReactNode
}) {
  return (
    <header className="cabecalho">
      <div>
        <h1>{titulo}</h1>
        <div className="cabecalho__descricao">{descricao}</div>
      </div>
      {acoes}
    </header>
  )
}
