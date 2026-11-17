// Tipos do contrato da API. Escritos a mao, espelhando os DTOs do backend --
// nada e gerado por ferramenta (o projeto proibe geradores de boilerplate).
// Quando o contrato muda, este arquivo muda no mesmo pull request.

export type Perfil = 'OPERADOR_HEMOCENTRO' | 'USUARIO_HOSPITAL' | 'LOGISTICA' | 'ADMIN'

/** GET /auth/me e itens de /usuarios. */
export interface UsuarioAtual {
  id: number
  nome: string
  email: string
  perfil: Perfil
}

/** POST /auth/login. expiresIn em segundos. */
export interface RespostaLogin {
  accessToken: string
  tokenType: string
  expiresIn: number
  usuario: UsuarioAtual
}

/** GET/PUT /usuarios/{id}/unidades. Conjunto vazio = sem acesso a unidades. */
export interface VinculosDeUnidade {
  unidadeIds: number[]
}

/** POST/PUT /hemocentros e /hospitais (UnidadeRequisicao). */
export interface EntradaUnidade {
  nome: string
  logradouro: string | null
  numero: string | null
  bairro: string | null
  cidade: string
  uf: string
  cep: string | null
  latitude: number
  longitude: number
}

export interface EntradaVeiculo {
  placa: string
  hemocentroBaseId: number
  capacidadeBolsas: number
  latitude: number
  longitude: number
}

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

export type StatusEntrega = 'PLANEJADA' | 'DESPACHADA' | 'EM_TRANSPORTE' | 'ENTREGUE' | 'CANCELADA'

export interface Entrega {
  id: number
  requisicaoId: number
  requisicaoCodigo: string
  veiculoId: number
  veiculoPlaca: string
  origemId: number
  origemNome: string
  status: StatusEntrega
  rota: string | null
  distanciaKm: number | null
  tempoEstimadoMin: number | null
  iniciadaEm: string | null
  concluidaEm: string | null
}

export type StatusVeiculo = 'DISPONIVEL' | 'EM_ROTA' | 'MANUTENCAO'

export interface Veiculo {
  id: number
  placa: string
  hemocentroBaseId: number
  hemocentroBaseNome: string
  capacidadeBolsas: number
  status: StatusVeiculo
  latitude: number
  longitude: number
}

export interface Alerta {
  id: number
  tipo: string
  nivel: string
  mensagem: string
  veiculoId: number | null
  entregaId: number | null
  bolsaId: number | null
  criadoEm: string
}

export interface LeituraDeTelemetria {
  id: number
  veiculoId: number
  lat: number
  lon: number
  temperaturaC: number
  statusVeiculo: string
  registradaEm: string
  recebidaEm: string
  dentroDaFaixaDidatica: boolean
}

/** GET /telemetrias/metricas (so ADMIN). Contadores desde o inicio do processo. */
export interface MetricasDeTelemetria {
  leiturasRecebidas: number
  leiturasPersistidas: number
  /** Recusadas porque a fila de ingestao estava cheia (nao por formato). */
  leiturasRecusadas: number
  lotesGravados: number
  tamanhoMedioDoLote: number
  tempoTotalDeGravacaoMs: number
  tamanhoAtualDaFila: number
  capacidadeDaFila: number
  quantidadeDeWorkers: number
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

export interface BolsaGerada {
  id: number
  codigo: string
  componente: TipoComponente
  dataValidade: string
  status: EstadoBolsa
}

export interface Doacao {
  id: number
  codigo: string
  hemocentroId: number
  tipoSanguineo: string
  volumeMl: number
  dataHora: string
  bolsasGeradas: BolsaGerada[]
}
