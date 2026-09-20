/**
 * Aviso obrigatorio em toda tela que mostra dado do dominio.
 *
 * Nao e enfeite: o projeto e academico, os dados sao sinteticos e as regras de
 * compatibilidade sao didaticas. Quem olha a tela precisa saber disso sem
 * precisar perguntar.
 */
export function AvisoAcademico({ complemento }: { complemento?: string }) {
  return (
    <div className="aviso aviso--academico">
      <strong>Projeto acadêmico.</strong> Todos os dados são sintéticos — não há
      informação real de doador ou paciente. As regras de compatibilidade sanguínea
      são didáticas e não constituem orientação clínica.
      {complemento && <> {complemento}</>}
    </div>
  )
}

/** Marca explicitamente o que ainda é provisório da Unidade 1. */
export function AvisoProvisorioU1({ texto }: { texto: string }) {
  return (
    <div className="aviso aviso--academico">
      <strong>Unidade 1 — regra provisória.</strong> {texto}
    </div>
  )
}
