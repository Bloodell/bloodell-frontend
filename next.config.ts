import type { NextConfig } from 'next'

// Em producao a interface vira arquivos estaticos (pasta out/), servidos pelo
// Nginx da EC2 -- o mesmo modelo de deploy que o build do Vite tinha.
// Em desenvolvimento, o rewrite faz o navegador enxergar API e interface na
// MESMA origem, entao o dia a dia nao depende de CORS. Rewrites nao existem em
// exportacao estatica, por isso so entram no "next dev".
const emDesenvolvimento = process.env.NODE_ENV === 'development'
const backendLocal = process.env.BACKEND_URL ?? 'http://127.0.0.1:8080'

const configuracao: NextConfig = emDesenvolvimento
  ? {
      async rewrites() {
        return ['/api/:caminho*', '/swagger-ui.html', '/swagger-ui/:caminho*', '/v3/:caminho*'].map((source) => ({
          source,
          destination: `${backendLocal}${source}`,
        }))
      },
    }
  : {
      output: 'export',
      trailingSlash: true,
      images: { unoptimized: true },
    }

export default configuracao
