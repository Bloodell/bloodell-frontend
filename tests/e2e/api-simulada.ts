import type { Page, Route } from '@playwright/test'

/**
 * Backend simulado COM ESTADO, so para os testes e2e. Imita as regras que a
 * interface depende (transicoes, 401/403, paginacao), nao o backend inteiro.
 */
type Perfil = 'OPERADOR_HEMOCENTRO' | 'USUARIO_HOSPITAL' | 'LOGISTICA' | 'ADMIN'
interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  senha: string
}

const HEMOPE = { id: 10, tipo: 'HEMOCENTRO', nome: 'Hemocentro Central', cidade: 'Recife', uf: 'PE', latitude: -8.0476, longitude: -34.877 }
const HOSPITAL = { id: 20, tipo: 'HOSPITAL', nome: 'Hospital Boa Vista', cidade: 'Recife', uf: 'PE', latitude: -8.06, longitude: -34.89 }

export interface Estado {
  usuarios: Usuario[]
  vinculos: Map<number, number[]>
  doacoes: Record<string, unknown>[]
  bolsas: { id: number; codigo: string; componente: string; tipoSanguineo: string; status: string }[]
  requisicoes: Record<string, unknown>[]
  entregas: Record<string, unknown>[]
  veiculos: Record<string, unknown>[]
  /** Token -> usuario; "expirar" invalida todos. */
  tokens: Map<string, number>
  proximo: number
}

export function estadoInicial(): Estado {
  return {
    usuarios: [
      { id: 1, nome: 'Ana Admin', email: 'admin@bloodell.dev', perfil: 'ADMIN', senha: 'senha-admin-123' },
      { id: 2, nome: 'Otto Operador', email: 'otto@bloodell.dev', perfil: 'OPERADOR_HEMOCENTRO', senha: 'senha-otto-1234' },
    ],
    vinculos: new Map([[2, [10]]]),
    doacoes: [],
    bolsas: [],
    requisicoes: [],
    entregas: [],
    veiculos: [{ id: 1, placa: 'ABC1D23', hemocentroBaseId: 10, hemocentroBaseNome: HEMOPE.nome, capacidadeBolsas: 20, status: 'DISPONIVEL', latitude: HEMOPE.latitude, longitude: HEMOPE.longitude }],
    tokens: new Map(),
    proximo: 100,
  }
}

function problema(status: number, detail: string, campos?: { campo: string; mensagem: string }[]) {
  return { status, corpo: { type: 'about:blank', title: 'Erro', status, detail, campos } }
}

function pagina<T>(itens: T[], page: number, size: number) {
  return {
    content: itens.slice(page * size, (page + 1) * size),
    number: page,
    size,
    totalElements: itens.length,
    totalPages: Math.max(1, Math.ceil(itens.length / size)),
  }
}

function semSenha({ senha: _senha, ...usuario }: Usuario) {
  void _senha
  return usuario
}

export async function instalarApiSimulada(page: Page, estado: Estado = estadoInicial()): Promise<Estado> {
  await page.route('**/api/v1/**', async (route: Route) => {
    const requisicao = route.request()
    const url = new URL(requisicao.url())
    const caminho = url.pathname.replace(/^\/api\/v1/, '')
    const metodo = requisicao.method()
    const corpo = requisicao.postDataJSON?.() as Record<string, unknown> | undefined
    const responder = async ({ status = 200, corpo: resposta }: { status?: number; corpo?: unknown }) =>
      status === 204
        ? route.fulfill({ status })
        : route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(resposta ?? null) })

    if (metodo === 'POST' && caminho === '/auth/login') {
      const usuario = estado.usuarios.find((u) => u.email === String(corpo?.email).toLowerCase() && u.senha === corpo?.senha)
      if (!usuario) return responder(problema(401, 'Credenciais inválidas.'))
      const token = `tk-${estado.proximo++}`
      estado.tokens.set(token, usuario.id)
      return responder({ corpo: { accessToken: token, tokenType: 'Bearer', expiresIn: 900, usuario: semSenha(usuario) } })
    }

    const token = requisicao.headers().authorization?.replace('Bearer ', '')
    const usuarioId = token ? estado.tokens.get(token) : undefined
    const atual = estado.usuarios.find((u) => u.id === usuarioId)
    if (!atual) return responder(problema(401, 'Token ausente, invalido ou expirado.'))
    const admin = atual.perfil === 'ADMIN'

    // --- Autenticacao e usuarios ---
    if (caminho === '/auth/me') return responder({ corpo: semSenha(atual) })
    if (caminho.startsWith('/usuarios')) {
      if (!admin) return responder(problema(403, 'Voce nao tem permissao para realizar esta operacao.'))
      const id = Number(caminho.split('/')[2])
      if (metodo === 'GET' && caminho === '/usuarios')
        return responder({ corpo: pagina(estado.usuarios.map(semSenha), Number(url.searchParams.get('page') ?? 0), Number(url.searchParams.get('size') ?? 20)) })
      if (metodo === 'POST' && caminho === '/usuarios') {
        if (estado.usuarios.some((u) => u.email === String(corpo?.email).toLowerCase())) return responder(problema(409, 'E-mail ja cadastrado.'))
        const novo = { ...(corpo as unknown as Usuario), email: String(corpo?.email).toLowerCase(), id: estado.proximo++ }
        estado.usuarios.push(novo)
        return responder({ status: 201, corpo: semSenha(novo) })
      }
      if (caminho.endsWith('/unidades')) {
        if (metodo === 'PUT') estado.vinculos.set(id, (corpo?.unidadeIds as number[]) ?? [])
        return responder({ corpo: { unidadeIds: estado.vinculos.get(id) ?? [] } })
      }
      const alvo = estado.usuarios.find((u) => u.id === id)
      if (!alvo) return responder(problema(404, 'Usuario nao encontrado.'))
      if (metodo === 'PATCH') Object.assign(alvo, corpo)
      return responder({ corpo: semSenha(alvo) })
    }

    // --- Rede ---
    const vinculadas = admin ? null : (estado.vinculos.get(atual.id) ?? [])
    const enxerga = (id: number) => vinculadas === null || vinculadas.includes(id)
    if (caminho === '/hemocentros') return responder({ corpo: [HEMOPE].filter((u) => enxerga(u.id)) })
    if (caminho === '/hospitais') return responder({ corpo: [HOSPITAL].filter((u) => admin || enxerga(u.id) || enxerga(10)) })
    if (caminho === '/veiculos' && metodo === 'GET') return responder({ corpo: estado.veiculos })
    if (caminho === '/alertas') return responder({ corpo: [] })
    if (caminho.startsWith('/veiculos/') && caminho.endsWith('/telemetrias')) return responder({ corpo: [] })

    // --- Doacoes ---
    if (caminho === '/doacoes' && metodo === 'POST') {
      const componentes = (corpo?.componentes as string[]) ?? []
      const id = estado.proximo++
      const bolsasGeradas = componentes.map((componente) => {
        const bolsa = { id: estado.proximo++, codigo: `BOL-${estado.proximo}`, componente, tipoSanguineo: String(corpo?.tipoSanguineo), status: 'DISPONIVEL' }
        estado.bolsas.push(bolsa)
        return { ...bolsa, dataValidade: '2027-01-01' }
      })
      const doacao = { id, codigo: `DOA-${id}`, hemocentroId: corpo?.hemocentroId, tipoSanguineo: corpo?.tipoSanguineo, volumeMl: corpo?.volumeMl, dataHora: new Date().toISOString(), bolsasGeradas }
      estado.doacoes.push(doacao)
      return responder({ status: 201, corpo: doacao })
    }
    if (caminho === '/doacoes') return responder({ corpo: estado.doacoes })

    // --- Requisicoes ---
    if (caminho === '/requisicoes/fila')
      return responder({
        corpo: estado.requisicoes
          .filter((r) => r.status === 'NA_FILA')
          .map((r, indice) => ({ posicao: indice + 1, codigo: r.codigo, hospital: HOSPITAL.nome, prioridade: r.prioridade, sequenciaChegada: r.id })),
      })
    if (caminho === '/requisicoes' && metodo === 'POST') {
      const id = estado.proximo++
      const itens = (corpo?.itens as Record<string, unknown>[]).map((item, indice) => ({ ...item, id: indice + 1, quantidadeAlocada: 0 }))
      const nova = { id, codigo: `REQ-${id}`, hospitalId: corpo?.hospitalId, hospitalNome: HOSPITAL.nome, prioridade: corpo?.prioridade, status: 'NA_FILA', criadaEm: new Date().toISOString(), atendidaEm: null, itens }
      estado.requisicoes.unshift(nova)
      return responder({ status: 201, corpo: nova })
    }
    if (caminho === '/requisicoes') {
      const status = url.searchParams.get('status')
      const lista = status ? estado.requisicoes.filter((r) => r.status === status) : estado.requisicoes
      return responder({ corpo: pagina(lista, Number(url.searchParams.get('page') ?? 0), Number(url.searchParams.get('size') ?? 20)) })
    }
    const req = /^\/requisicoes\/(\d+)(\/alocacoes)?$/.exec(caminho)
    if (req) {
      const requisicao = estado.requisicoes.find((r) => r.id === Number(req[1]))
      if (!requisicao) return responder(problema(404, 'Requisicao nao encontrada.'))
      if (req[2] && metodo === 'POST') {
        // Aloca o que houver de bolsa compativel (tipo e componente iguais).
        const bolsasUsadas: Record<string, unknown>[] = []
        let solicitada = 0
        for (const item of requisicao.itens as Record<string, number | string>[]) {
          solicitada += Number(item.quantidade)
          const livres = estado.bolsas.filter((b) => b.status === 'DISPONIVEL' && b.componente === item.componente && b.tipoSanguineo === item.tipoSanguineo)
          const usar = livres.slice(0, Number(item.quantidade))
          usar.forEach((bolsa) => (bolsa.status = 'ALOCADA'))
          item.quantidadeAlocada = usar.length
          bolsasUsadas.push(...usar.map((b) => ({ bolsaId: b.id, codigo: b.codigo, tipoSanguineo: b.tipoSanguineo, componente: b.componente, dataValidade: '2027-01-01', sequenciaEntrada: b.id })))
        }
        if (bolsasUsadas.length === 0) return responder(problema(409, 'Nenhuma bolsa elegivel.'))
        requisicao.status = 'ALOCADA'
        return responder({
          status: 201,
          corpo: {
            requisicaoId: requisicao.id,
            requisicaoCodigo: requisicao.codigo,
            statusRequisicao: 'ALOCADA',
            politicaAplicada: 'Ordem de chegada',
            avisoAcademico: 'Regra didática.',
            quantidadeSolicitada: solicitada,
            quantidadeAlocada: bolsasUsadas.length,
            bolsas: bolsasUsadas,
            passos: [{ ordem: 1, etapa: 'Busca', detalhe: 'Bolsas compatíveis', resultado: `${bolsasUsadas.length} encontrada(s)` }],
          },
        })
      }
      return responder({ corpo: requisicao })
    }

    // --- Entregas ---
    if (caminho === '/entregas' && metodo === 'POST') {
      const requisicao = estado.requisicoes.find((r) => r.id === corpo?.requisicaoId)
      if (corpo?.rota !== null) return responder(problema(400, 'Rota deve ser um documento JSON.'))
      const id = estado.proximo++
      const nova = {
        id,
        requisicaoId: requisicao?.id,
        requisicaoCodigo: requisicao?.codigo,
        veiculoId: corpo?.veiculoId,
        veiculoPlaca: 'ABC1D23',
        origemId: 10,
        origemNome: HEMOPE.nome,
        status: 'PLANEJADA',
        rota: null,
        distanciaKm: null,
        tempoEstimadoMin: corpo?.tempoEstimadoMin ?? null,
        iniciadaEm: null,
        concluidaEm: null,
      }
      estado.entregas.push(nova)
      return responder({ status: 201, corpo: nova })
    }
    if (caminho === '/entregas') return responder({ corpo: estado.entregas })
    const ent = /^\/entregas\/(\d+)(?:\/(roteirizacao|despacho|inicio-transporte|conclusao))?$/.exec(caminho)
    if (ent) {
      const entrega = estado.entregas.find((e) => e.id === Number(ent[1]))
      if (!entrega) return responder(problema(404, 'Entrega nao encontrada.'))
      const veiculo = estado.veiculos[0]
      const requisicao = estado.requisicoes.find((r) => r.id === entrega.requisicaoId)
      switch (ent[2]) {
        case 'roteirizacao':
          entrega.rota = JSON.stringify({
            paradas: [
              { ordem: 0, tipo: 'HEMOCENTRO', unidadeId: 10, nome: HEMOPE.nome, latitude: HEMOPE.latitude, longitude: HEMOPE.longitude },
              { ordem: 1, tipo: 'HOSPITAL', unidadeId: 20, nome: HOSPITAL.nome, latitude: HOSPITAL.latitude, longitude: HOSPITAL.longitude },
            ],
          })
          entrega.distanciaKm = 2.31
          break
        case 'despacho':
          entrega.status = 'DESPACHADA'
          veiculo.status = 'EM_ROTA'
          if (requisicao) requisicao.status = 'EM_ROTA'
          break
        case 'inicio-transporte':
          entrega.status = 'EM_TRANSPORTE'
          entrega.iniciadaEm = new Date().toISOString()
          break
        case 'conclusao':
          entrega.status = 'ENTREGUE'
          entrega.concluidaEm = new Date().toISOString()
          veiculo.status = 'DISPONIVEL'
          if (requisicao) requisicao.status = 'ATENDIDA'
          break
      }
      return responder({ corpo: entrega })
    }

    // --- Indicadores e demais leituras: vazios coerentes ---
    const estatistica = { quantidade: 0, soma: 0, media: 0, mediana: 0, minimo: 0, maximo: 0, desvioPadraoAmostral: 0, coeficienteDeVariacao: 0 }
    if (caminho === '/indicadores/estoque')
      return responder({ corpo: { aviso: '', totalDeBolsasDisponiveis: estado.bolsas.filter((b) => b.status === 'DISPONIVEL').length, porTipoSanguineo: [], porComponente: [], distribuicaoPorTipo: estatistica } })
    if (caminho === '/indicadores/demanda')
      return responder({ corpo: { aviso: '', totalDeRequisicoes: estado.requisicoes.length, porHospital: [], porPrioridade: [], distribuicaoPorHospital: estatistica } })
    if (caminho === '/indicadores/tempos')
      return responder({ corpo: { aviso: '', unidade: 'min', requisicoesAtendidas: 0, requisicoesNaFila: 0, tempoAteAtendimento: estatistica } })
    if (caminho.startsWith('/estoques')) return responder({ corpo: [] })
    if (caminho.startsWith('/bolsas')) return responder({ corpo: pagina([], 0, 10) })

    return responder(problema(404, `Rota simulada ausente: ${metodo} ${caminho}`))
  })
  return estado
}

export async function entrar(page: Page, email: string, senha: string, destino = '/') {
  await page.goto(`/login?voltar=${encodeURIComponent(destino)}`)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(senha)
  await page.getByRole('button', { name: 'Entrar' }).click()
}
