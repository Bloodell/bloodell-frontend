import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { Layout } from './componentes/Layout'
import './estilos/global.css'
import { PaginaDeAlgoritmos } from './paginas/PaginaDeAlgoritmos'
import { PaginaDeDoacoes } from './paginas/PaginaDeDoacoes'
import { PaginaDeEstoque } from './paginas/PaginaDeEstoque'
import { PaginaDeRequisicoes } from './paginas/PaginaDeRequisicoes'
import { PaginaDeUnidades } from './paginas/PaginaDeUnidades'
import { PaginaDoPainel } from './paginas/PaginaDoPainel'

const rotas = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <PaginaDoPainel /> },
      { path: 'estoque', element: <PaginaDeEstoque /> },
      { path: 'doacoes', element: <PaginaDeDoacoes /> },
      { path: 'requisicoes', element: <PaginaDeRequisicoes /> },
      { path: 'algoritmos', element: <PaginaDeAlgoritmos /> },
      { path: 'unidades', element: <PaginaDeUnidades /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={rotas} />
  </StrictMode>,
)
