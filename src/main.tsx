import { StrictMode, Suspense, lazy, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { Layout } from './componentes/Layout'
import './estilos/global.css'
import './estilos/refino.css'
const PaginaDoPainel = lazy(() => import('./paginas/PaginaDoPainel').then((m) => ({ default: m.PaginaDoPainel })))
const PaginaDeEstoque = lazy(() => import('./paginas/PaginaDeEstoque').then((m) => ({ default: m.PaginaDeEstoque })))
const PaginaDeDoacoes = lazy(() => import('./paginas/PaginaDeDoacoes').then((m) => ({ default: m.PaginaDeDoacoes })))
const PaginaDeRequisicoes = lazy(() => import('./paginas/PaginaDeRequisicoes').then((m) => ({ default: m.PaginaDeRequisicoes })))
const PaginaDeEntregas = lazy(() => import('./paginas/PaginaDeEntregas').then((m) => ({ default: m.PaginaDeEntregas })))
const PaginaDaCadeiaFria = lazy(() => import('./paginas/PaginaDaCadeiaFria').then((m) => ({ default: m.PaginaDaCadeiaFria })))
const PaginaDeUnidades = lazy(() => import('./paginas/PaginaDeUnidades').then((m) => ({ default: m.PaginaDeUnidades })))
const PaginaDeAlgoritmos = lazy(() => import('./paginas/PaginaDeAlgoritmos').then((m) => ({ default: m.PaginaDeAlgoritmos })))

function carregar(pagina: ReactNode) {
  return <Suspense fallback={<div className="estado" role="status">Carregando página…</div>}>{pagina}</Suspense>
}

const rotas = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: carregar(<PaginaDoPainel />) },
      { path: 'estoque', element: carregar(<PaginaDeEstoque />) },
      { path: 'entregas', element: carregar(<PaginaDeEntregas />) },
      { path: 'cadeia-fria', element: carregar(<PaginaDaCadeiaFria />) },
      { path: 'doacoes', element: carregar(<PaginaDeDoacoes />) },
      { path: 'requisicoes', element: carregar(<PaginaDeRequisicoes />) },
      { path: 'algoritmos', element: carregar(<PaginaDeAlgoritmos />) },
      { path: 'unidades', element: carregar(<PaginaDeUnidades />) },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>,
)
