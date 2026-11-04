import type { Metadata } from 'next'
import { Plus } from 'lucide-react'
import { EtiquetaDeBolsa } from '@/components/dominio/etiqueta-de-bolsa'
import { MonogramaDeTipo } from '@/components/dominio/monograma-de-tipo'
import { Cabecalho } from '@/components/layout/cabecalho'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TIPOS_SANGUINEOS, type Tom } from '@/lib/formatos'

export const metadata: Metadata = { title: 'Sistema visual' }

const PAPEIS = [
  { nome: 'Marca', classe: 'bg-primary', uso: 'Identidade e ação primária. Nunca indica estado.' },
  { nome: 'Crítico', classe: 'bg-critico', uso: 'Emergência, vencida, fora da faixa, erro.' },
  { nome: 'Atenção', classe: 'bg-atencao', uso: 'Vence em breve, fila urgente.' },
  { nome: 'Estável', classe: 'bg-estavel', uso: 'Disponível, dentro da faixa, atendida.' },
  { nome: 'Cadeia fria', classe: 'bg-frio', uso: 'Temperatura, transporte refrigerado.' },
]

const TONS: { tom: Tom; texto: string }[] = [
  { tom: 'erro', texto: 'Emergência' },
  { tom: 'atencao', texto: 'Urgente' },
  { tom: 'sucesso', texto: 'Disponível' },
  { tom: 'frio', texto: 'Em transporte' },
  { tom: 'info', texto: 'Alocada' },
  { tom: 'neutro', texto: 'Eletiva' },
]

const ESCALA = [
  { classe: 'text-display', nome: 'display', exemplo: '128' },
  { classe: 'text-metrica', nome: 'metrica', exemplo: '1.284 bolsas' },
  { classe: 'text-titulo', nome: 'titulo', exemplo: 'Requisições' },
  { classe: 'text-subtitulo', nome: 'subtitulo', exemplo: 'Fila de atendimento' },
  { classe: 'text-sm', nome: 'corpo', exemplo: 'Emergência, depois urgente, depois eletiva.' },
  { classe: 'text-rotulo', nome: 'rotulo', exemplo: 'Hemocomponente' },
  { classe: 'text-apoio', nome: 'apoio', exemplo: 'Atualizado há 8 s' },
]

/** Referencia do sistema visual. Os valores sao ilustrativos: nao vem da API. */
export default function PaginaDoSistemaVisual() {
  return (
    <div className="space-y-8">
      <Cabecalho
        titulo="Sistema visual"
        descricao="Cores por papel, tipografia e componentes do BLOODELL. Página de referência: os valores são ilustrativos e não vêm da API."
      />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cores por papel</CardTitle>
            <CardDescription>Nenhum papel divide matiz com outro. Todo estado também tem ícone e texto.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PAPEIS.map((papel) => (
              <li key={papel.nome} className="rounded-lg border p-3">
                <span className={`block h-10 rounded-md ${papel.classe}`} aria-hidden="true" />
                <p className="mt-2 text-rotulo font-semibold">{papel.nome}</p>
                <p className="text-apoio text-muted-foreground">{papel.uso}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Escala tipográfica</CardTitle>
              <CardDescription>Instrument Sans na interface; JetBrains Mono nos dados.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ESCALA.map((item) => (
              <div key={item.nome} className="flex items-baseline gap-4 border-b pb-2 last:border-0">
                <span className="w-20 shrink-0 font-mono text-apoio text-muted-foreground">{item.nome}</span>
                <span className={`${item.classe} font-semibold tracking-tight`}>{item.exemplo}</span>
              </div>
            ))}
            <p className="font-mono text-rotulo">BL-2026-004817 · 4,2 °C · QXZ-7K42</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Estados</CardTitle>
              <CardDescription>Ícone + texto + cor. Sem um dos três, o estado ainda se entende.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {TONS.map(({ tom, texto }) => (
                <Badge key={tom} tom={tom}>
                  {texto}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button>
                <Plus />
                Nova requisição
              </Button>
              <Button variant="secondary">Secundário</Button>
              <Button variant="outline">Atualizar</Button>
              <Button variant="ghost">Cancelar</Button>
              <Button variant="destructive">Descartar bolsa</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ex-campo">Quantidade de bolsas</Label>
                <Input id="ex-campo" defaultValue="2" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ex-select">Hospital</Label>
                <Select id="ex-select" defaultValue="a">
                  <option value="a">Hospital da Restauração</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Tipo sanguíneo</CardTitle>
            <CardDescription>Rh positivo é bloco cheio; Rh negativo é bloco vazado com sinal de menos.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {TIPOS_SANGUINEOS.map((tipo) => (
              <MonogramaDeTipo key={tipo} tipo={tipo} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {TIPOS_SANGUINEOS.slice(0, 4).map((tipo) => (
              <MonogramaDeTipo key={tipo} tipo={tipo} tamanho="sm" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-subtitulo font-semibold tracking-tight">Etiqueta de bolsa</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <EtiquetaDeBolsa
            codigo="BL-2026-004817"
            tipoSanguineo="O-"
            componente="CONCENTRADO_HEMACIAS"
            dataValidade="2026-11-26"
            diasParaVencer={23}
            dataColeta="2026-10-15"
            unidade="Hemocentro Recife"
          />
          <EtiquetaDeBolsa
            codigo="BL-2026-004902"
            tipoSanguineo="A+"
            componente="PLAQUETAS"
            dataValidade="2026-11-04"
            diasParaVencer={1}
            dataColeta="2026-10-30"
            unidade="Hemocentro Olinda"
          />
          <EtiquetaDeBolsa
            codigo="BL-2026-004311"
            tipoSanguineo="AB-"
            componente="PLASMA"
            dataValidade="2026-10-31"
            diasParaVencer={-3}
            dataColeta="2025-10-31"
            unidade="Hemocentro Recife"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-rotulo font-semibold">Padrão</p>
            <p className="text-apoio text-muted-foreground">Painel comum.</p>
          </CardContent>
        </Card>
        <Card peso="destaque">
          <CardContent className="pt-5">
            <p className="text-rotulo font-semibold">Destaque</p>
            <p className="text-apoio text-muted-foreground">O que pede atenção agora.</p>
          </CardContent>
        </Card>
        <Card peso="plano">
          <CardContent className="pt-5">
            <p className="text-rotulo font-semibold">Plano</p>
            <p className="text-apoio text-muted-foreground">Apoio e contexto.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
