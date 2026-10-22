import { useState, type FormEvent, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Icone, Marca, type NomeIcone } from './Icone'

const paginas: { caminho: string; rotulo: string; icone: NomeIcone; fim?: boolean }[] = [
  { caminho: '/', rotulo: 'Visão geral', icone: 'inicio', fim: true },
  { caminho: '/estoque', rotulo: 'Estoque', icone: 'estoque' },
  { caminho: '/doacoes', rotulo: 'Doações', icone: 'doacao' },
  { caminho: '/requisicoes', rotulo: 'Requisições', icone: 'requisicoes' },
  { caminho: '/entregas', rotulo: 'Entregas', icone: 'entregas' },
  { caminho: '/cadeia-fria', rotulo: 'Cadeia fria', icone: 'termometro' },
  { caminho: '/unidades', rotulo: 'Unidades', icone: 'unidades' },
  { caminho: '/algoritmos', rotulo: 'Estruturas (AED)', icone: 'algoritmos' },
]

export function Layout() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const navegar = useNavigate()

  function pesquisar(evento: FormEvent) {
    evento.preventDefault()
    navegar(`/estoque${busca.trim() ? `?busca=${encodeURIComponent(busca.trim())}` : ''}`)
    setMenuAberto(false)
  }

  return (
    <div className="aplicacao">
      {menuAberto && <button className="menu-sombra" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
      <aside className={`lateral${menuAberto ? ' lateral--aberta' : ''}`}>
        <div className="lateral__topo">
          <Marca clara />
          <button className="botao-icone lateral__fechar" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}><Icone nome="fechar" /></button>
        </div>
        <p className="lateral__grupo">OPERAÇÃO</p>
        <nav className="navegacao" aria-label="Navegação principal">
          {paginas.map((pagina) => (
            <NavLink key={pagina.caminho} to={pagina.caminho} end={pagina.fim}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) => `navegacao__item${isActive ? ' navegacao__item--ativo' : ''}`}>
              <Icone nome={pagina.icone} />
              <span>{pagina.rotulo}</span>
            </NavLink>
          ))}
        </nav>
        <div className="lateral__rodape">
          <span className="lateral__sinal" />
          <div><strong>Ambiente acadêmico</strong><small>Dados sintéticos · CESAR School</small></div>
        </div>
      </aside>

      <div className="conteudo">
        <div className="barra-superior">
          <button className="botao-icone menu-botao" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}><Icone nome="menu" /></button>
          <span className="barra-superior__contexto">Gestão de hemocomponentes <span>/</span> Rede Bloodell</span>
          <form className="busca-global" role="search" onSubmit={pesquisar}>
            <Icone nome="busca" />
            <input aria-label="Buscar bolsa no estoque" placeholder="Buscar bolsa no estoque" value={busca} onChange={(evento) => setBusca(evento.target.value)} />
          </form>
          <div className="perfil-demo" aria-label="Acesso de demonstração">
            <span className="perfil-demo__avatar">BD</span>
            <span><strong>Demonstração</strong><small>Sem autenticação</small></span>
          </div>
        </div>
        <main id="conteudo-principal"><Outlet /></main>
      </div>
    </div>
  )
}

export function Cabecalho({ titulo, descricao, acoes, secao }: {
  titulo: string
  descricao: string
  acoes?: ReactNode
  secao?: string
}) {
  return (
    <header className="cabecalho">
      <div>
        <div className="cabecalho__secao">{secao ?? 'BLOODELL / OPERAÇÃO'}</div>
        <h1>{titulo}</h1>
        <p className="cabecalho__descricao">{descricao}</p>
      </div>
      {acoes && <div className="cabecalho__acoes">{acoes}</div>}
    </header>
  )
}
