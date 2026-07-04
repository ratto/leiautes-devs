/**
 * E2E do gerador — o fluxo crítico do PRD:
 * selecionar leiaute → preencher → validar → gerar → baixar,
 * mais os componentes-assinatura: visualizador monoespaçado,
 * card de registro-detalhe e o toggle global de validação.
 */

import { expect, test } from '@playwright/test';

test.describe('Gerador de arquivos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/gerador');
  });

  test('fluxo crítico: selecionar leiaute, preencher, validar e baixar', async ({ page }) => {
    // 1. Seleciona o leiaute RCB001 (só retorno — o chip remessa desabilita).
    await page.getByTestId('layout-chip-RCB001').click();
    await expect(page.getByTestId('viewer-filename')).toHaveText('rcb001_retorno.ret');
    await expect(page.getByTestId('kind-chip-remessa')).toBeDisabled();

    // 2. Preenche o header (campos obrigatórios).
    await page.getByTestId('field-agency').fill('1234');
    await page.getByTestId('field-account').fill('12345678');
    await page.getByTestId('field-companyName').fill('EMPRESA TESTE LTDA');

    // 3. Preenche o registro-detalhe (inclui os campos do bug RF-11).
    const detail = page.getByTestId('detail-body-0');
    await detail.getByTestId('field-ourNumber').fill('123456789012');
    await detail.getByTestId('field-occurrenceDate').fill('15062026');
    await detail.getByTestId('field-titleAmount').fill('150000');
    await detail.getByTestId('field-receivedAmount').fill('150000');
    await detail.getByTestId('field-feeAmount').fill('1050');

    // 4. O resumo de validação some e o badge do registro fica válido.
    await expect(page.getByTestId('validation-summary')).toBeHidden();
    await expect(page.getByTestId('detail-badge-0')).toContainText('válido');

    // 5. O visualizador reflete o conteúdo ao vivo (valor recebido na linha 2).
    await expect(page.getByTestId('viewer-lines')).toContainText('EMPRESA TESTE LTDA');

    // 6. Baixa o arquivo com a extensão correta.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-button').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('rcb001_retorno.ret');
    await expect(page.getByText('Arquivo gerado. Bom teste')).toBeVisible();
  });

  test('validação ligada bloqueia download de arquivo inválido (RF-10)', async ({ page }) => {
    // Campos obrigatórios vazios → resumo de erros visível.
    await expect(page.getByTestId('validation-summary')).toBeVisible();

    // O botão de download fica marcado como bloqueado para acessibilidade.
    await expect(page.getByTestId('download-button')).toHaveAttribute('aria-disabled', 'true');

    // Clicar mesmo assim mostra a notificação de bloqueio (sem download).
    await page.getByTestId('download-button').click({ force: true });
    await expect(page.getByText(/Arquivo com \d+ erros? de validação/)).toBeVisible();
  });

  test('validação desligada permite forçar erros de propósito (RF-10)', async ({ page }) => {
    // Desliga a validação global.
    await page.getByTestId('validation-toggle').click();
    await expect(page.getByTestId('validation-badge')).toContainText('validação: off');
    await expect(page.getByTestId('viewer-validation-badge')).toContainText('validação: off');

    // O resumo de erros some (o usuário está no modo "quebrar de propósito").
    await expect(page.getByTestId('validation-summary')).toBeHidden();

    // Valor com letras no campo numérico é aceito e vai para o arquivo.
    const detail = page.getByTestId('detail-body-0');
    await detail.getByTestId('field-receivedAmount').fill('00ABC8');
    await expect(page.getByTestId('viewer-lines')).toContainText('00ABC8');

    // E o download passa a funcionar mesmo com o arquivo malformado.
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-button').click();
    await downloadPromise;
  });

  test('troca de leiaute reconfigura o formulário sem recarregar (RF-02/RF-03)', async ({
    page,
  }) => {
    await page.getByTestId('field-companyName').fill('EMPRESA TESTE LTDA');

    await page.getByTestId('layout-chip-CNAB400').click();
    await expect(page.getByTestId('viewer-filename')).toHaveText('cnab400_retorno.ret');
    // Campo comum preservado ao alternar leiautes (RF-03).
    await expect(page.getByTestId('field-companyName')).toHaveValue(
      'EMPRESA TESTE LTDA',
    );

    // CNAB400 suporta remessa: alternar muda extensão e campos.
    await page.getByTestId('kind-chip-remessa').click();
    await expect(page.getByTestId('viewer-filename')).toHaveText('cnab400_remessa.rem');
  });

  test('card de registro-detalhe: abre/fecha, duplica e remove (RF-05/RF-06)', async ({
    page,
  }) => {
    // Fecha e reabre com confiabilidade (bug do protótipo corrigido).
    await expect(page.getByTestId('detail-body-0')).toBeVisible();
    await page.getByTestId('detail-toggle-0').click();
    await expect(page.getByTestId('detail-body-0')).toBeHidden();
    await page.getByTestId('detail-toggle-0').click();
    await expect(page.getByTestId('detail-body-0')).toBeVisible();

    // Duplica: o novo registro herda os valores.
    await page.getByTestId('detail-body-0').getByTestId('field-titleAmount').fill('150000');
    await page.getByTestId('detail-duplicate-0').click();
    await expect(
      page.getByTestId('detail-body-1').getByTestId('field-titleAmount'),
    ).toHaveValue('150000');

    // Remove: volta a um registro.
    await page.getByTestId('detail-remove-1').click();
    await expect(page.getByTestId('detail-toggle-1')).toBeHidden();
  });

  test('foco no campo acende o trecho no visualizador (RF-14)', async ({ page }) => {
    const detail = page.getByTestId('detail-body-0');
    await detail.getByTestId('field-receivedAmount').fill('150000');
    await detail.getByTestId('field-receivedAmount').focus();
    // O <mark> de destaque aparece com o valor formatado (15 dígitos no U).
    await expect(page.locator('.viewer__highlight')).toHaveText('000000000150000');
  });

  test('copiar leva o conteúdo à área de transferência (RF-15)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Desliga a validação para liberar a cópia sem preencher tudo.
    await page.getByTestId('validation-toggle').click();
    await page.getByTestId('copy-button').click();
    await expect(page.getByText('Conteúdo copiado')).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('\r\n');
    expect(clipboard.split('\r\n')[0]).toHaveLength(240);
  });
});
