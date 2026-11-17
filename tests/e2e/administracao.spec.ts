import { expect, test } from '@playwright/test'
import { entrar, instalarApiSimulada } from './api-simulada'

test.describe('administração', () => {
  test('admin cria usuario e vincula unidade', async ({ page }) => {
    const estado = await instalarApiSimulada(page)
    await entrar(page, 'admin@bloodell.dev', 'senha-admin-123', '/usuarios')
    await expect(page.getByRole('heading', { name: 'Usuários' })).toBeVisible()

    await page.getByRole('button', { name: 'Novo usuário' }).click()
    const cadastro = page.getByRole('dialog')
    await cadastro.getByLabel('Nome').fill('Lia Logística')
    await cadastro.getByLabel('E-mail').fill('lia@bloodell.dev')
    await cadastro.getByText('Logística', { exact: true }).click()
    await cadastro.getByLabel('Senha inicial').fill('senha-inicial-lia')
    await cadastro.getByRole('button', { name: 'Cadastrar usuário' }).click()

    // Depois de criar, o detalhe abre direto para vincular unidades.
    const detalhe = page.getByRole('dialog', { name: 'Lia Logística' })
    await detalhe.getByLabel(/Hemocentro Central/).check()
    await detalhe.getByRole('button', { name: 'Salvar vínculos' }).click()

    await expect.poll(() => estado.vinculos.get(estado.usuarios.at(-1)!.id)).toEqual([10])
  })

  test('nao admin nao ve a area e a API direta responde 403', async ({ page }) => {
    await instalarApiSimulada(page)
    await entrar(page, 'otto@bloodell.dev', 'senha-otto-1234', '/usuarios')
    await expect(page.getByText('Área restrita a administradores')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Usuários' })).toHaveCount(0)

    const status = await page.evaluate(async () => (await fetch('/api/v1/usuarios', { headers: { Authorization: 'Bearer invalido' } })).status)
    expect(status).toBe(401)
  })
})
