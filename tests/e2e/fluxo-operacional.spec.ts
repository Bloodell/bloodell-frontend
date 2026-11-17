import { expect, test } from '@playwright/test'
import { entrar, instalarApiSimulada } from './api-simulada'

/**
 * Doacao -> bolsas -> requisicao de dois itens -> alocacao (parcial) ->
 * entrega sem rota -> calcular rota -> despacho -> transporte -> conclusao.
 */
test('fluxo completo de uma bolsa ate o hospital', async ({ page }) => {
  const estado = await instalarApiSimulada(page)
  await entrar(page, 'admin@bloodell.dev', 'senha-admin-123', '/doacoes')

  // 1. Doacao O+ gera plasma (alem do concentrado ja marcado).
  await page.getByLabel('Hemocentro', { exact: true }).selectOption({ label: 'Hemocentro Central · Recife/PE' })
  await page.getByRole('checkbox', { name: /^Plasma/ }).check({ force: true })
  await page.getByRole('button', { name: 'Registrar doação' }).click()
  await expect(page.getByText(/Doação DOA-\d+ registrada/).first()).toBeVisible()
  expect(estado.bolsas).toHaveLength(2)

  // 2. Requisicao com dois itens: 1 concentrado O+ e 2 plasma O+ (so 1 plasma existe).
  await page.getByRole('link', { name: 'Requisições', exact: true }).click()
  await page.getByRole('button', { name: 'Nova requisição' }).first().click()
  const formulario = page.getByRole('dialog')
  await formulario.getByRole('button', { name: 'Adicionar outro hemocomponente' }).click()
  const item2 = formulario.getByRole('listitem', { name: 'Item 2' })
  await item2.getByLabel('Hemocomponente').selectOption('PLASMA')
  await item2.getByRole('button', { name: 'Aumentar quantidade do item 2' }).click()
  await formulario.getByRole('button', { name: 'Criar requisição' }).click()

  // 3. Processa a alocacao no detalhe: atendimento parcial (2 de 3).
  const detalhe = page.getByRole('dialog')
  await detalhe.getByRole('button', { name: 'Processar alocação agora' }).click()
  const alocacao = page.getByRole('dialog')
  await expect(alocacao.getByText('Atendimento parcial.')).toBeVisible()
  const itens = estado.requisicoes[0].itens as { quantidadeAlocada: number }[]
  expect(itens.reduce((soma, item) => soma + item.quantidadeAlocada, 0)).toBe(2)
  await page.keyboard.press('Escape')

  // 4. Entrega sem rota digitada.
  await page.getByRole('link', { name: 'Entregas', exact: true }).click()
  await page.getByRole('button', { name: 'Planejar entrega' }).first().click()
  const planejamento = page.getByRole('dialog')
  await planejamento.getByText(/^REQ-\d+$/).first().click()
  await planejamento.getByLabel('Veículo').selectOption({ index: 1 })
  await planejamento.getByRole('button', { name: 'Planejar entrega' }).click()

  // 5. Calcula a rota e avanca as etapas no detalhe.
  const entrega = page.getByRole('dialog')
  await entrega.getByRole('button', { name: 'Calcular rota' }).click()
  await expect(entrega.getByText('em linha reta')).toBeVisible()
  for (const etapa of ['Despachar', 'Iniciar transporte', 'Concluir entrega']) {
    await entrega.getByRole('button', { name: etapa }).click()
    await expect(entrega.getByRole('button', { name: etapa })).toHaveCount(0)
  }
  await expect(entrega.getByText('Entrega concluída. Nada mais a fazer.')).toBeVisible()

  expect(estado.entregas[0]).toMatchObject({ status: 'ENTREGUE' })
  expect(estado.requisicoes[0]).toMatchObject({ status: 'ATENDIDA' })
  expect(estado.veiculos[0]).toMatchObject({ status: 'DISPONIVEL' })
})
