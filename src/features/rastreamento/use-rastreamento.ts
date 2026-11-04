'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRecurso } from '@/lib/api/use-recurso'
import type { Entrega, Pagina, Requisicao, Unidade, Veiculo } from '@/lib/api/tipos'
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

const coordenadaValida = (c: Coordenada | null | undefined): c is Coordenada =>
  !!c && Number.isFinite(c[0]) && Number.isFinite(c[1]) && !(c[0] === 0 && c[1] === 0)

/**
 * Monta as entregas ativas a partir da API: a origem (hemocentro) e o destino
 * (hospital da requisicao) saem das unidades, que trazem coordenadas reais.
 */
function entregasDaApi(
  entregas: Entrega[],
  hemocentros: Unidade[],
  hospitais: Unidade[],
  requisicoes: Requisicao[],
  veiculos: Veiculo[],
): EntregaBase[] {
  const resultado: EntregaBase[] = []
  for (const entrega of entregas) {
    if (!STATUS_ATIVOS.includes(entrega.status)) continue
    const origem = hemocentros.find((u) => u.id === entrega.origemId)
    const requisicao = requisicoes.find((r) => r.id === entrega.requisicaoId)
    const destino = hospitais.find((u) => u.id === requisicao?.hospitalId)
    if (!origem || !destino) continue
    const veiculo = veiculos.find((v) => v.id === entrega.veiculoId)
    const posicao: Coordenada | null = veiculo ? [veiculo.longitude, veiculo.latitude] : null
    resultado.push({
      id: String(entrega.id),
      codigo: entrega.requisicaoCodigo,
      placa: entrega.veiculoPlaca,
      status: entrega.status,
      prioridade: requisicao?.prioridade ?? null,
      origem: comoPonto(origem),
      destino: comoPonto(destino),
      distanciaKm: entrega.distanciaKm,
      tempoEstimadoMin: entrega.tempoEstimadoMin,
      iniciadaEm: entrega.iniciadaEm,
      posicaoReportada: coordenadaValida(posicao) ? posicao : null,
      simulada: false,
    })
  }
  return resultado
}

export interface Rastreamento {
  entregas: EntregaNoMapa[]
  modo: Modo
  /** Por que a tela caiu na simulacao (null quando o modo foi escolhido ou e "api"). */
  motivoDaSimulacao: string | null
  carregando: boolean
  recarregar: () => void
}

export function useRastreamento(forcarSimulacao: boolean): Rastreamento {
  const entregas = useRecurso<Entrega[]>('/entregas')
  const hemocentros = useRecurso<Unidade[]>('/hemocentros')
  const hospitais = useRecurso<Unidade[]>('/hospitais')
  const requisicoes = useRecurso<Pagina<Requisicao>>('/requisicoes?size=100')
  const veiculos = useRecurso<Veiculo[]>('/veiculos')

  const recursos = [entregas, hemocentros, hospitais, requisicoes, veiculos]
  const consultando = recursos.some((recurso) => recurso.carregando && !recurso.dados)
  const falha = recursos.find((recurso) => recurso.erro && !recurso.dados)

  const reais = useMemo(
    () =>
      entregas.dados && hemocentros.dados && hospitais.dados
        ? entregasDaApi(
            entregas.dados,
            hemocentros.dados,
            hospitais.dados,
            requisicoes.dados?.content ?? [],
            veiculos.dados ?? [],
          )
        : [],
    [entregas.dados, hemocentros.dados, hospitais.dados, requisicoes.dados, veiculos.dados],
  )

  let modo: Modo = 'api'
  let motivoDaSimulacao: string | null = null
  if (forcarSimulacao) modo = 'simulacao'
  else if (!consultando && falha) {
    modo = 'simulacao'
    motivoDaSimulacao = 'A API não respondeu.'
  } else if (!consultando && reais.length === 0) {
    modo = 'simulacao'
    motivoDaSimulacao = 'Não há entregas em andamento na API.'
  }

  const bases = useMemo(() => (modo === 'simulacao' ? entregasSimuladas() : reais), [modo, reais])
  const chaveDasBases = bases.map((base) => base.id).join('|') + modo

  const [resolvidas, setResolvidas] = useState<{ chave: string; entregas: EntregaNoMapa[] } | null>(null)

  useEffect(() => {
    if (consultando && !forcarSimulacao) return
    let cancelado = false
    Promise.all(
      bases.map(async (base) => {
        const rota = await obterRota(base.origem.coordenada, base.destino.coordenada)
        return { ...base, trajeto: new Trajeto(rota.coordenadas), fonteDaRota: rota.fonte } satisfies EntregaNoMapa
      }),
    ).then((prontas) => {
      if (!cancelado) setResolvidas({ chave: chaveDasBases, entregas: prontas })
    })
    return () => {
      cancelado = true
    }
    // `bases` muda de identidade a cada render; a chave e o que importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDasBases, consultando, forcarSimulacao])

  const prontas = resolvidas?.chave === chaveDasBases ? resolvidas.entregas : null

  return {
    entregas: prontas ?? [],
    modo,
    motivoDaSimulacao,
    carregando: (consultando && !forcarSimulacao) || prontas === null,
    recarregar: () => recursos.forEach((recurso) => recurso.recarregar()),
  }
}
