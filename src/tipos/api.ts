// Tipos do contrato da API. Escritos a mao, espelhando os DTOs do backend --
// nada e gerado por ferramenta (o projeto proibe geradores de boilerplate).
// Quando o contrato muda, este arquivo muda no mesmo pull request.

export interface Unidade {
  id: number
  tipo: 'HEMOCENTRO' | 'HOSPITAL'
  nome: string
  cidade: string
  uf: string
  latitude: number
  longitude: number
}

export type TipoComponente = 'CONCENTRADO_HEMACIAS' | 'PLASMA' | 'PLAQUETAS'

export type EstadoBolsa =
  | 'RECEBIDA'
  | 'ARMAZENADA'
  | 'DISPONIVEL'
  | 'RESERVADA'
  | 'ALOCADA'
  | 'DESPACHADA'
  | 'EM_TRANSPORTE'
  | 'ENTREGUE'
  | 'DESCARTADA'
  | 'VENCIDA'

export interface Bolsa {
  id: number
  codigo: string
  tipoSanguineo: string
  componente: TipoComponente
  dataColeta: string
  dataValidade: string
  status: EstadoBolsa
  unidadeAtualId: number
  unidadeAtualNome: string
  sequenciaEntrada: number
  dentroDaValidade: boolean
  diasParaVencer: number
}

export interface Pagina<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ItemDeEstoque {
  id: number
  unidadeId: number
  unidadeNome: string
  tipoSanguineo: string
  componente: TipoComponente
  quantidade: number
  atualizadoEm: string
}

export type Prioridade = 'EMERGENCIA' | 'URGENTE' | 'ELETIVA'

export type StatusRequisicao =
  | 'CRIADA'
  | 'NA_FILA'
  | 'EM_PROCESSAMENTO'
  | 'ALOCADA'
  | 'EM_ROTA'
  | 'ATENDIDA'
  | 'REJEITADA'
  | 'CANCELADA'

export interface ItemDeRequisicao {
  id: number
  componente: TipoComponente
  tipoSanguineo: string
  quantidade: number
  quantidadeAlocada: number
}

export interface Requisicao {
  id: number
  codigo: string
  hospitalId: number
  hospitalNome: string
  prioridade: Prioridade
  status: StatusRequisicao
  criadaEm: string
  atendidaEm: string | null
  itens: ItemDeRequisicao[]
}

export interface ItemDaFila {
  posicao: number
  codigo: string
  hospital: string
  prioridade: Prioridade
  sequenciaChegada: number
}

export interface PassoDaDecisao {
  ordem: number
  etapa: string
  detalhe: string
  resultado: string
}

export interface BolsaAlocada {
  bolsaId: number
  codigo: string
  tipoSanguineo: string
  componente: TipoComponente
  dataValidade: string
  sequenciaEntrada: number
}

export interface ResultadoDaAlocacao {
  requisicaoId: number
  requisicaoCodigo: string
  statusRequisicao: StatusRequisicao
  politicaAplicada: string
  avisoAcademico: string
  quantidadeSolicitada: number
  quantidadeAlocada: number
  bolsas: BolsaAlocada[]
  passos: PassoDaDecisao[]
}

export interface NoDaLista {
  posicao: number
  codigo: string
  tipoSanguineo: string
  componente: TipoComponente
  dataValidade: string
  status: EstadoBolsa
  sequenciaEntrada: number
}

export interface SnapshotDaLista {
  estrutura: string
  ordem: string
  tamanho: number
  capturadoEm: string
  observacao: string
  nos: NoDaLista[]
}

export interface NoDaFila {
  posicao: number
  codigo: string
  hospital: string
  prioridade: Prioridade
  sequenciaChegada: number
}

export interface SnapshotDaFila {
  estrutura: string
  politica: string
  tamanho: number
  capturadoEm: string
  observacao: string
  nos: NoDaFila[]
}

export interface NoDaPilha {
  posicaoDoTopo: number
  codigoBolsa: string
  statusAnterior: string | null
  statusNovo: string
  ocorridoEm: string
}

export interface SnapshotDaPilha {
  estrutura: string
  ordem: string
  tamanho: number
  capturadoEm: string
  observacao: string
  nos: NoDaPilha[]
}

export interface SituacaoDoModuloAed {
  etapaVigente: string
  implementados: string[]
  pendentesDaUnidadeDois: string[]
  observacao: string
}

export interface ContagemPorCategoria {
  categoria: string
  quantidade: number
}

export interface EstatisticaDescritiva {
  quantidade: number
  soma: number
  media: number
  mediana: number
  minimo: number
  maximo: number
  desvioPadraoAmostral: number
  coeficienteDeVariacao: number
}

export interface IndicadorDeEstoque {
  aviso: string
  totalDeBolsasDisponiveis: number
  porTipoSanguineo: ContagemPorCategoria[]
  porComponente: ContagemPorCategoria[]
  distribuicaoPorTipo: EstatisticaDescritiva
}

export interface IndicadorDeDemanda {
  aviso: string
  totalDeRequisicoes: number
  porHospital: ContagemPorCategoria[]
  porPrioridade: ContagemPorCategoria[]
  distribuicaoPorHospital: EstatisticaDescritiva
}

export interface IndicadorDeTempos {
  aviso: string
  unidade: string
  requisicoesAtendidas: number
  requisicoesNaFila: number
  tempoAteAtendimento: EstatisticaDescritiva
}

export interface EventoDeRastreabilidade {
  id: number
  statusAnterior: string | null
  statusNovo: string
  descricao: string | null
  ocorridoEm: string
}

/** Envelope de erro da API (RFC 7807). Toda falha chega neste formato. */
export interface ProblemaApi {
  type: string
  title: string
  status: number
  detail: string
  instance?: string
  momento?: string
  correlacao?: string
  campos?: { campo: string; mensagem: string }[]
}
