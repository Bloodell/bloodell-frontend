'use client'

import { useEffect, useMemo, useState } from 'react'
import { buscarPorIds, useRequisicoesPorIds } from '@/lib/api/paginacao'
import { useEscopo } from '@/lib/api/escopo'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Entrega, LeituraDeTelemetria, Requisicao, Unidade } from '@/lib/api/tipos'
import { interpretarRota } from '../entregas/rota-planejada'
import { STATUS_ATIVOS, type Coordenada, type EntregaBase, type EntregaNoMapa, type PontoDaRede } from './modelo'
import { obterRota } from './rotas'
import { entregasSimuladas } from './simulacao'
import { Trajeto } from './trajeto'

export type Modo = 'api' | 'simulacao'

const comoPonto = (unidade: Unidade): PontoDaRede => ({
  id: String(unidade.id),
  nome: unidade.nome,
  tipo: unidade.tipo,
  coordenada: [unidade.longitude, unidade.latitude],
})

/** (0, 0) e uma coordenada valida; so descartamos o que nao e numero ou sai da faixa. */
export const coordenadaValida = (c: Coordenada | null | undefined): c is Coordenada =>
  !!c && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90

export interface UltimaLeitura {
  coordenada: Coordenada
  registradaEm: string
}

/**
 * Monta as entregas ativas a partir da API. Origem e destino saem, nesta
 * ordem, das paradas gravadas pela roteirizacao e das unidades cadastradas;
 * o destino precisa da requisicao (hospital), buscada por ID.
 */
export function entregasDaApi(
  entregas: Entrega[],
  hemocentros: Unidade[],
  hospitais: Unidade[],
  requisicoes: Map<number, Requisicao>,
  leituras: Map<number, UltimaLeitura>,
): { bases: EntregaBase[]; semLocal: string[] } {
  const bases: EntregaBase[] = []
  const semLocal: string[] = []
  for (const entrega of entregas) {
    if (!STATUS_ATIVOS.includes(entrega.status)) continue
    const rota = interpretarRota(entrega.rota)
    const requisicao = requisicoes.get(entrega.requisicaoId)

    const primeira = rota?.paradas[0]
    const ultima = rota?.paradas[rota.paradas.length - 1]
    const origemCadastrada = hemocentros.find((u) => u.id === entrega.origemId)
    const destinoCadastrado = hospitais.find((u) => u.id === requisicao?.hospitalId)

    const origem: PontoDaRede | null = origemCadastrada
      ? comoPonto(origemCadastrada)
      : primeira
        ? { id: String(primeira.unidadeId), nome: primeira.nome, tipo: 'HEMOCENTRO', coordenada: [primeira.longitude, primeira.latitude] }
        : null
    const destino: PontoDaRede | null = destinoCadastrado
      ? comoPonto(destinoCadastrado)
      : ultima && ultima.tipo === 'HOSPITAL'
        ? { id: String(ultima.unidadeId), nome: ultima.nome, tipo: 'HOSPITAL', coordenada: [ultima.longitude, ultima.latitude] }
        : null

    if (!origem || !destino) {
      semLocal.push(entrega.requisicaoCodigo)
      continue
    }

    const leitura = entrega.status === 'EM_TRANSPORTE' ? leituras.get(entrega.veiculoId) : undefined
    bases.push({
      id: String(entrega.id),
      codigo: entrega.requisicaoCodigo,
      placa: entrega.veiculoPlaca,
      status: entrega.status,
      prioridade: requisicao?.prioridade ?? null,
      origem,
      destino,
      distanciaKm: entrega.distanciaKm,
      tempoEstimadoMin: entrega.tempoEstimadoMin,
      iniciadaEm: entrega.iniciadaEm,
      posicaoReportada: leitura && coordenadaValida(leitura.coordenada) ? leitura.coordenada : null,
      posicaoRegistradaEm: leitura?.registradaEm ?? null,
      simulada: false,
    })
  }
  return { bases, semLocal }
}

/** Tudo que muda o desenho de uma entrega: se algo daqui muda, o mapa recalcula. */
export function assinaturaDasBases(bases: EntregaBase[]): string {
  return JSON.stringify(
    bases.map((b) => [
      b.id,
      b.status,
      b.prioridade,
      b.origem.coordenada,
      b.destino.coordenada,
      b.posicaoReportada,
      b.posicaoRegistradaEm,
      b.iniciadaEm,
      b.tempoEstimadoMin,
      b.distanciaKm,
    ]),
  )
}

/** Ultima leitura de telemetria de cada veiculo em transporte (a API devolve da mais recente). */
function useUltimasLeituras(alvos: { veiculoId: number; desde: string | null }[]) {
  const escopo = useEscopo()
  const chave = JSON.stringify(alvos)
  const [gatilho, setGatilho] = useState(0)
  const [estado, setEstado] = useState<{ base: string; leituras: Map<number, UltimaLeitura> } | null>(null)
  const base = `${escopo}|${chave}`

  useEffect(() => {
    let cancelado = false
    const lista = JSON.parse(chave) as { veiculoId: number; desde: string | null }[]
    const desdePorVeiculo = new Map(lista.map((alvo) => [alvo.veiculoId, alvo.desde]))
    buscarPorIds<LeituraDeTelemetria[]>(
      lista.map((alvo) => alvo.veiculoId),
      (id) => {
        const desde = desdePorVeiculo.get(id)
        return `/veiculos/${id}/telemetrias${desde ? `?de=${encodeURIComponent(desde)}` : ''}`
      },
    )
      .then(({ encontrados }) => {
        if (cancelado) return
        const leituras = new Map<number, UltimaLeitura>()
        for (const [veiculoId, historico] of encontrados) {
          const maisRecente = [...historico].sort((a, b) => Date.parse(b.registradaEm) - Date.parse(a.registradaEm))[0]
          if (maisRecente) leituras.set(veiculoId, { coordenada: [maisRecente.lon, maisRecente.lat], registradaEm: maisRecente.registradaEm })
        }
        setEstado({ base, leituras })
      })
      // Sem telemetria o mapa estima pelo horario; o 401 ja encerra a sessao.
      .catch(() => !cancelado && setEstado({ base, leituras: new Map() }))
    return () => {
      cancelado = true
    }
  }, [base, chave, gatilho])

  return {
    leituras: estado?.base === base ? estado.leituras : null,
    recarregar: () => setGatilho((valor) => valor + 1),
  }
}

export interface Rastreamento {
  entregas: EntregaNoMapa[]
  modo: Modo
  carregando: boolean
  /** Falha real da API (nunca vira simulacao sozinha). */
  erro: string | null
  statusDoErro: number | null
  /** Entregas ativas sem origem ou destino localizavel. */
  semLocal: string[]
  atualizadoEm: number | null
  recarregar: () => void
}

/**
 * Entregas no mapa. Modo "simulacao" so quando a pessoa pede: API vazia mostra
 * vazio, API com erro mostra erro. Nada de caminhao inventado no lugar.
 */
export function useRastreamento(simulacao: boolean): Rastreamento {
  const entregas = useRecurso<Entrega[]>(simulacao ? null : '/entregas')
  const hemocentros = useRecurso<Unidade[]>(simulacao ? null : '/hemocentros')
  const hospitais = useRecurso<Unidade[]>(simulacao ? null : '/hospitais')

  const ativas = useMemo(() => (entregas.dados ?? []).filter((entrega) => STATUS_ATIVOS.includes(entrega.status)), [entregas.dados])
  const requisicoes = useRequisicoesPorIds(simulacao ? [] : ativas.map((entrega) => entrega.requisicaoId))
  const leituras = useUltimasLeituras(
    simulacao
      ? []
      : ativas
          .filter((entrega) => entrega.status === 'EM_TRANSPORTE')
          .map((entrega) => ({ veiculoId: entrega.veiculoId, desde: entrega.iniciadaEm }))
          .sort((a, b) => a.veiculoId - b.veiculoId),
  )

  const recursos = [entregas, hemocentros, hospitais]
  const falha = simulacao ? undefined : recursos.find((recurso) => recurso.erro)
  const consultando =
    !simulacao &&
    !falha &&
    (recursos.some((recurso) => !recurso.dados) || requisicoes.resultado === null || leituras.leituras === null)

  const { bases, semLocal } = useMemo(() => {
    if (simulacao) return { bases: entregasSimuladas(), semLocal: [] }
    if (!entregas.dados || !hemocentros.dados || !hospitais.dados || !requisicoes.resultado || !leituras.leituras)
      return { bases: [], semLocal: [] }
    return entregasDaApi(entregas.dados, hemocentros.dados, hospitais.dados, requisicoes.resultado.encontrados, leituras.leituras)
  }, [simulacao, entregas.dados, hemocentros.dados, hospitais.dados, requisicoes.resultado, leituras.leituras])

  const assinatura = assinaturaDasBases(bases) + (simulacao ? '|sim' : '|api')
  const [resolvidas, setResolvidas] = useState<{ assinatura: string; entregas: EntregaNoMapa[]; em: number } | null>(null)

  useEffect(() => {
    if (consultando) return
    let cancelado = false
    Promise.all(
      bases.map(async (base) => {
        // A geometria fica em cache por par de coordenadas (ver rotas.ts);
        // status, posicao e horarios vem sempre da consulta atual.
        const rota = await obterRota(base.origem.coordenada, base.destino.coordenada)
        return { ...base, trajeto: new Trajeto(rota.coordenadas), fonteDaRota: rota.fonte } satisfies EntregaNoMapa
      }),
    ).then((prontas) => {
      if (!cancelado) setResolvidas({ assinatura, entregas: prontas, em: Date.now() })
    })
    return () => {
      cancelado = true
    }
    // `bases` muda de identidade a cada render; a assinatura cobre o conteudo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura, consultando])

  const prontas = resolvidas?.assinatura === assinatura ? resolvidas : null

  return {
    entregas: prontas?.entregas ?? [],
    modo: simulacao ? 'simulacao' : 'api',
    carregando: !falha && (consultando || prontas === null),
    erro: falha?.erro ?? null,
    statusDoErro: falha?.statusHttp ?? null,
    semLocal,
    atualizadoEm: prontas?.em ?? null,
    recarregar: () => {
      recursos.forEach((recurso) => recurso.recarregar())
      requisicoes.recarregar()
      leituras.recarregar()
    },
  }
}
