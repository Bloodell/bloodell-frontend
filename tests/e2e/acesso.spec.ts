import { expect, test } from '@playwright/test'
import { entrar, estadoInicial, instalarApiSimulada } from './api-simulada'

test.describe('acesso', () => {
  test('tela protegida manda para o login e volta ao caminho pedido', async ({ page }) => {
    await instalarApiSimulada(page)
    await page.goto('/cadeia-fria')
    await expect(page).toHaveURL(/\/login\?voltar=%2Fcadeia-fria/)

    await page.getByLabel('E-mail').fill('otto@bloodell.dev')
    await page.getByLabel('Senha', { exact: true }).fill('senha-otto-1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/cadeia-fria/)
    await expect(page.getByRole('heading', { name: 'Cadeia fria', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Conta de Otto Operador' })).toBeVisible()
  })

  test('credencial errada mostra a mensagem certa e nao entra', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-errada-xyz')
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('recarregar a pagina pede login de novo (sessao so em memoria)', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234', '/estoque')
    await expect(page.getByRole('heading', { name: 'Estoque', exact: true })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(/\/login/)
  })

  test('token invalidado no servidor encerra a sessao com aviso', async ({ page }) => {
    const estado = await instalarApiSimulada(page, estadoInicial())
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234', '/estoque')
    await expect(page.getByRole('heading', { name: 'Estoque', exact: true })).toBeVisible()

    estado.tokens.clear()
    await page.getByRole('button', { name: 'Atualizar' }).click()

    await expect(page).toHaveURL(/motivo=expirada/)
    await expect(page.getByText('Sua sessão terminou')).toBeVisible()
  })

  test('sair limpa a sessao', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234')
    await page.getByRole('button', { name: 'Conta de Otto Operador' }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/estoque')
    await expect(page).toHaveURL(/\/login/)
  })

  test('menu e identidade no celular @mobile', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234')
    await page.getByRole('button', { name: 'Abrir menu' }).click()
    await expect(page.getByRole('link', { name: 'Requisições' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Usuários' })).toHaveCount(0)
  })
})
