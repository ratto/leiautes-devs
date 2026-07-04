/**
 * E2E da landing page: marca, CTA, tema (com easter egg) e privacidade.
 */

import { expect, test } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/');
  });

  test('apresenta a proposta de valor em PT-BR', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Arquivos bancários');
    await expect(page.getByText('Seus dados nunca saem do seu navegador').first()).toBeVisible();
    // Assinatura de origem: café extra-forte no rodapé (PRD §11).
    await expect(page.getByText('café extra-forte')).toBeVisible();
  });

  test('CTA "Gerar meu arquivo" leva ao gerador', async ({ page }) => {
    await page.getByTestId('cta-generate').click();
    await expect(page).toHaveURL(/#\/gerador$/);
    await expect(page.getByRole('heading', { name: 'Gerador de arquivos' })).toBeVisible();
  });

  test('toggle de tema alterna dark/light e carrega o easter egg do Erick', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    const toggle = page.getByTestId('theme-toggle');
    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Easter egg canônico no tooltip (RF-17).
    await toggle.hover();
    await expect(page.getByText('por sua culpa, Erick!')).toBeVisible();

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});
