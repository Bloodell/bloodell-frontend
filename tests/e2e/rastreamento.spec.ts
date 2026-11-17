import { expect, test } from '@playwright/test'
import { entrar, instalarApiSimulada } from './api-simulada'

test.describe('central logística', () => {
  test('sem entregas ativas mostra vazio, nunca simulacao', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234', '/rastreamento')
    await expect(page.getByText('Dados da API')).toBeVisible()
    await expect(page.getByText(/Nenhuma entrega em andamento/)).toBeVisible()
    await expect(page.getByText('SIMULAÇÃO')).toHaveCount(0)
    // No build de operacao nao existe botao de simulacao.
    await expect(page.getByRole('button', { name: 'Ver simulação' })).toHaveCount(0)
  })

  test('API fora do ar mostra erro e tentar novamente', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234')
    await page.route('**/api/v1/entregas', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 503, title: 'x', detail: 'Banco indisponível.' }) }),
    )
    await page.getByRole('link', { name: 'Central logística' }).click()
    await expect(page.getByText('Não foi possível consultar a API.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    await expect(page.getByText('SIMULAÇÃO')).toHaveCount(0)
  })
})
