'use client'

import { ChevronDown, ChevronUp, Compass, Layers, LocateFixed, MapPinOff, Minus, Plus, RotateCw } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { suportaWebgl, useMovimentoReduzido, useTemaDoMapa } from './ambiente'
import type { ComandosDoMapa } from './mapa-logistico'
import type { EstadoDoVeiculo } from './modelo'
import { DetalhesDaEntrega, FaixaDeIndicadores, ListaDeEntregas, MarcaDeSimulacao, classePainel } from './paineis'
import { estadoDoVeiculo } from './posicao'
import { useRastreamento } from './use-rastreamento'

// MapLibre e Three.js so descem para quem abre esta tela, e nunca no servidor.
const MapaLogistico = dynamic(() => import('./mapa-logistico'), {
  ssr: false,
  loading: () => <Skeleton className="absolute inset-0 rounded-none" />,
})

function BotaoDoMapa({ rotulo, onClick, children }: { rotulo: string; onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="ghost" size="icon" aria-label={rotulo} title={rotulo} onClick={onClick} className="text-foreground">
      {children}
    </Button>
  )
}

/** Central logistica: mapa 3D com as entregas em andamento, painéis flutuantes e detalhes por entrega. */
export function PaginaDeRastreamento() {
  const [forcarSimulacao, setForcarSimulacao] = useState(false)
  const rastreamento = useRastreamento(forcarSimulacao)
  const { entregas, modo, motivoDaSimulacao, carregando } = rastreamento

  const [selecionadaId, setSelecionadaId] = useState<string | null>(null)
  const [seguir, setSeguir] = useState(false)
  const [estados, setEstados] = useState<Map<string, EstadoDoVeiculo>>(new Map())
  const [listaAberta, setListaAberta] = useState(true)
  const [mapaPronto, setMapaPronto] = useState(false)
  const [erroDoMapa, setErroDoMapa] = useState<string | null>(null)
  const [contextoPerdido, setContextoPerdido] = useState(false)
  // Muda quando o contexto WebGL volta: o mapa e recriado do zero (restaurar em cima do contexto
  // antigo deixaria buffers e texturas invalidos tanto no MapLibre quanto no Three.js).
  const [geracaoDoMapa, setGeracaoDoMapa] = useState(0)

  const comandos = useRef<ComandosDoMapa>(null)
  const temaDoMapa = useTemaDoMapa()
  const movimentoReduzido = useMovimentoReduzido()
  const webgl = useSyncExternalStore(
    () => () => {},
    suportaWebgl,
    () => true,
  )

  const selecionada = entregas.find((entrega) => entrega.id === selecionadaId) ?? null

  const selecionar = useCallback((id: string | null) => {
    setSelecionadaId(id)
    setSeguir(id !== null)
  }, [])
  const pararDeSeguir = useCallback(() => setSeguir(false), [])

  const semMapa = !webgl || erroDoMapa !== null

  // Sem mapa ninguem calcula as posicoes quadro a quadro; a lista e os indicadores seguem vivos a 1 Hz.
  useEffect(() => {
    if (!semMapa) return
    const calcular = () => setEstados(new Map(entregas.map((entrega) => [entrega.id, estadoDoVeiculo(entrega, Date.now())])))
    calcular()
    const intervalo = setInterval(calcular, 1000)
    return () => clearInterval(intervalo)
  }, [semMapa, entregas])

  return (
    <div className="fixed top-14 right-0 bottom-0 left-0 z-10 overflow-hidden bg-muted lg:left-60">
      {!semMapa && !carregando && (
        <MapaLogistico
          key={geracaoDoMapa}
          entregas={entregas}
          selecionadaId={selecionada?.id ?? null}
          seguir={seguir}
          tema={temaDoMapa}
          movimentoReduzido={movimentoReduzido}
          aoSelecionar={selecionar}
          aoPararDeSeguir={pararDeSeguir}
          aoAtualizar={setEstados}
          aoPronto={() => setMapaPronto(true)}
          aoFalhar={setErroDoMapa}
          aoMudarContexto={(perdido) => {
            setContextoPerdido(perdido)
            if (!perdido) {
              setMapaPronto(false)
              setGeracaoDoMapa((geracao) => geracao + 1)
            }
          }}
          comandos={comandos}
        />
      )}

      {(carregando || (!semMapa && !mapaPronto)) && !semMapa && (
        <div role="status" className="absolute inset-0 z-10 grid place-items-center bg-muted/80">
          <p className="rounded-lg border bg-card px-4 py-2.5 text-rotulo shadow-lg">Carregando o mapa e as rotas…</p>
        </div>
      )}

      {semMapa && (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div role="alert" className={cn(classePainel, 'max-w-md p-6 text-center')}>
            <MapPinOff className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-subtitulo font-semibold">Mapa 3D indisponível</p>
            <p className="mt-1.5 text-rotulo text-muted-foreground">
              {!webgl
                ? 'Este navegador ou dispositivo não oferece WebGL, que o mapa precisa. As entregas continuam disponíveis na lista.'
                : `Não foi possível carregar o mapa. As entregas continuam na lista. (${erroDoMapa})`}
            </p>
            {webgl && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setErroDoMapa(null)}>
                <RotateCw />
                Tentar novamente
              </Button>
            )}
          </div>
        </div>
      )}

      {contextoPerdido && (
        <div role="status" className="absolute inset-0 z-20 grid place-items-center bg-background/70 backdrop-blur-sm">
          <p className={cn(classePainel, 'px-4 py-3 text-rotulo')}>
            A placa de vídeo reiniciou o contexto gráfico. Restaurando o mapa…
          </p>
        </div>
      )}

      {/* Camada de painéis: transparente a cliques, para o mapa continuar arrastável por baixo. */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute top-3 bottom-3 left-3 flex w-80 max-w-[calc(100%-1.5rem)] flex-col gap-2">
          <header className={cn(classePainel, 'pointer-events-auto p-3.5')}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-subtitulo font-semibold">Central logística</h1>
                <p className="mt-0.5 text-apoio text-muted-foreground">Hemocentros e hospitais conectados por entregas.</p>
              </div>
              {modo === 'simulacao' ? (
                <MarcaDeSimulacao />
              ) : (
                <span className="rounded-md border border-estavel/30 bg-estavel-suave px-2 py-0.5 text-apoio font-semibold text-estavel">
                  Dados da API
                </span>
              )}
            </div>
            {modo === 'simulacao' && motivoDaSimulacao && (
              <p className="mt-2 text-apoio text-muted-foreground">{motivoDaSimulacao} Exibindo uma rede fictícia.</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                selecionar(null)
                setForcarSimulacao((valor) => !valor)
              }}
            >
              {modo === 'simulacao' && forcarSimulacao ? 'Voltar aos dados da API' : modo === 'api' ? 'Ver simulação' : 'Tentar dados da API'}
            </Button>
          </header>

          <section className={cn(classePainel, 'pointer-events-auto flex min-h-0 flex-col overflow-hidden')}>
            <button
              type="button"
              onClick={() => setListaAberta((aberta) => !aberta)}
              aria-expanded={listaAberta}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            >
              <span className="text-rotulo font-semibold">
                Entregas <span className="font-normal text-muted-foreground">({entregas.length})</span>
              </span>
              {listaAberta ? <ChevronUp className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
            </button>
            {listaAberta && (
              <div className="min-h-0 overflow-y-auto border-t">
                {entregas.length ? (
                  <ListaDeEntregas entregas={entregas} estados={estados} selecionadaId={selecionada?.id ?? null} aoSelecionar={selecionar} />
                ) : (
                  <p className="p-4 text-rotulo text-muted-foreground">Nenhuma entrega em andamento.</p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="absolute top-3 right-3 left-[21.5rem] hidden max-w-3xl md:block">
          <div className="pointer-events-auto">
            <FaixaDeIndicadores entregas={entregas} estados={estados} />
          </div>
        </div>

        {selecionada && (
          <div className="pointer-events-auto absolute top-[5.5rem] right-3 hidden md:block">
            <DetalhesDaEntrega
              entrega={selecionada}
              estado={estados.get(selecionada.id)}
              seguindo={seguir}
              aoFechar={() => selecionar(null)}
              aoSeguir={() => setSeguir((valor) => !valor)}
              aoEnquadrar={() => {
                setSeguir(false)
                comandos.current?.enquadrarEntrega(selecionada.id)
              }}
            />
          </div>
        )}

        {!semMapa && (
          <div
            className={cn(
              classePainel,
              'pointer-events-auto absolute bottom-9 flex flex-col p-1 transition-[right] duration-200 ease-out',
              selecionada ? 'right-[21.75rem]' : 'right-3',
            )}
          >
            <BotaoDoMapa rotulo="Aproximar" onClick={() => comandos.current?.aproximar()}>
              <Plus />
            </BotaoDoMapa>
            <BotaoDoMapa rotulo="Afastar" onClick={() => comandos.current?.afastar()}>
              <Minus />
            </BotaoDoMapa>
            <BotaoDoMapa rotulo="Apontar para o norte" onClick={() => comandos.current?.norte()}>
              <Compass />
            </BotaoDoMapa>
            <BotaoDoMapa rotulo="Alternar entre vista inclinada e vista de cima" onClick={() => comandos.current?.alternarInclinacao()}>
              <Layers />
            </BotaoDoMapa>
            <BotaoDoMapa
              rotulo="Enquadrar toda a rede"
              onClick={() => {
                setSeguir(false)
                comandos.current?.enquadrarRede()
              }}
            >
              <LocateFixed />
            </BotaoDoMapa>
          </div>
        )}

        {modo === 'simulacao' && (
          <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 md:block">
            <p className={cn(classePainel, 'flex items-center gap-2 px-3 py-1.5 text-apoio')}>
              <MarcaDeSimulacao />
              Movimento fictício, só para demonstração. Não é rastreamento real.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
