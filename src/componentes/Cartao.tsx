interface PropriedadesDoCartao {
  titulo?: string
  ajuda?: string
  acoes?: React.ReactNode
  children: React.ReactNode
}

export function Cartao({ titulo, ajuda, acoes, children }: PropriedadesDoCartao) {
  return (
    <section className="cartao">
      {(titulo || acoes) && (
        <header className="cartao__titulo">
          <div>
            {titulo && <h2>{titulo}</h2>}
            {ajuda && <div className="cartao__ajuda">{ajuda}</div>}
          </div>
          {acoes}
        </header>
      )}
      {children}
    </section>
  )
}

export function Indicador({ valor, rotulo }: { valor: string | number; rotulo: string }) {
  return (
    <div className="cartao">
      <div className="indicador__valor">{valor}</div>
      <div className="indicador__rotulo">{rotulo}</div>
    </div>
  )
}
