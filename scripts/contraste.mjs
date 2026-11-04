/**
 * Confere os pares texto/fundo do sistema visual contra a WCAG 2.2 AA.
 * Le os tokens de src/app/globals.css (blocos :root e .dark); tokens em
 * rgb()/var() sao ignorados porque dependem de composicao.
 *   texto: 4.5:1    componente grafico/borda de campo: 3:1
 */
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8')

function tokens(seletor) {
  const bloco = css.match(new RegExp(String.raw`${seletor}\s*\{([\s\S]*?)\n\}`))?.[1] ?? ''
  return Object.fromEntries([...bloco.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map(([, nome, hex]) => [nome, hex]))
}

const luz = tokens(':root')
const escuro = { ...luz, ...tokens(String.raw`.dark`) }

const canal = (valor) => {
  const c = valor / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}
const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => canal(parseInt(hex.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const razao = (a, b) => {
  const [claro, escuroLum] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + 0.05) / (escuroLum + 0.05)
}

/** [texto/elemento, fundo, minimo, descricao] */
const PARES = [
  ['foreground', 'background', 4.5, 'texto sobre a pagina'],
  ['foreground', 'card', 4.5, 'texto sobre cartao'],
  ['muted-foreground', 'background', 4.5, 'texto secundario sobre a pagina'],
  ['muted-foreground', 'card', 4.5, 'texto secundario sobre cartao'],
  ['muted-foreground', 'muted', 4.5, 'texto secundario sobre area apagada'],
  ['primary-foreground', 'primary', 4.5, 'botao primario'],
  ['primary', 'background', 4.5, 'link/acento da marca sobre a pagina'],
  ['primary', 'card', 4.5, 'link/acento da marca sobre cartao'],
  ['secondary-foreground', 'secondary', 4.5, 'botao secundario'],
  ['accent-foreground', 'accent', 4.5, 'item em hover'],
  ['input', 'card', 3, 'borda de campo'],
  ['ring', 'background', 3, 'anel de foco sobre a pagina'],
  ['ring', 'card', 3, 'anel de foco sobre cartao'],
  ['critico-foreground', 'critico', 4.5, 'botao destrutivo'],
  ['critico', 'critico-suave', 4.5, 'critico: texto sobre fundo suave'],
  ['critico', 'card', 4.5, 'critico: texto sobre cartao'],
  ['atencao', 'atencao-suave', 4.5, 'atencao: texto sobre fundo suave'],
  ['atencao', 'card', 4.5, 'atencao: texto sobre cartao'],
  ['estavel', 'estavel-suave', 4.5, 'estavel: texto sobre fundo suave'],
  ['estavel', 'card', 4.5, 'estavel: texto sobre cartao'],
  ['frio', 'frio-suave', 4.5, 'cadeia fria: texto sobre fundo suave'],
  ['frio', 'card', 4.5, 'cadeia fria: texto sobre cartao'],
  ['sidebar-foreground', 'sidebar', 4.5, 'menu lateral'],
  ['sidebar-muted', 'sidebar', 4.5, 'menu lateral: texto secundario'],
  ['sidebar-foreground', 'sidebar-active', 4.5, 'menu lateral: item ativo'],
  ['sidebar-indicator', 'sidebar', 3, 'menu lateral: indicador'],
]

let falhas = 0
for (const [tema, mapa] of [['claro', luz], ['escuro', escuro]]) {
  console.log(`\nTema ${tema}`)
  for (const [a, b, minimo, descricao] of PARES) {
    if (!mapa[a] || !mapa[b]) {
      console.log(`  ?    ${descricao} (token ausente: ${!mapa[a] ? a : b})`)
      falhas++
      continue
    }
    const valor = razao(mapa[a], mapa[b])
    const ok = valor >= minimo
    if (!ok) falhas++
    console.log(`  ${ok ? 'ok  ' : 'FALHA'} ${valor.toFixed(2).padStart(5)}  (min ${minimo})  ${descricao}`)
  }
}
console.log(falhas ? `\n${falhas} par(es) abaixo do minimo.` : '\nTodos os pares atendem a WCAG AA.')
process.exit(falhas ? 1 : 0)
