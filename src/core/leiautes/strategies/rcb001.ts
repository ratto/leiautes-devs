/**
 * Estratégia RCB001 — retorno de recebimentos do comércio eletrônico
 * (Débito em Conta via Internet), Banco do Brasil.
 *
 * Fonte oficial: BB — "Soluções Eletrônicas: Manual Técnico — Débito em
 * Conta via Internet, Leiaute Arquivo Retorno, Formato RCB001", jun/2015.
 *
 * PREMISSAS DO LEIAUTE (risco R1 do PRD — documentar por leiaute):
 * - Registros de 150 posições identificados por LETRA: header 'A',
 *   detalhe 'G' e trailer 'Z'. Somente RETORNO (o RCB001 não tem remessa).
 * - Datas no formato AAAAMMDD (padrão deste manual, diferente dos CNABs).
 * - DVs da agência (G2.2) e da conta creditada (G2.4) calculados pelo motor
 *   por Módulo 11 do BB (nota 03: pesos crescentes 2,3,4…; 10 → 'X', 11 → '0').
 * - Código de barras (G5) montado a partir dos subcampos oficiais G5.1–G5.9,
 *   com DV geral por Módulo 10 (nota 06) calculado pelo motor e o "valor em
 *   reais" (G5.5) espelhando o Valor Recebido (G6) em 11 posições.
 * - "Nº Sequencial de Registro" (G8) usa o número da linha no arquivo.
 * - Campos "Uso Futuro" ficam em branco (lacunas alfanuméricas), inclusive
 *   as posições 143–150 do header (vazias para o comércio eletrônico).
 */

import { modulo10, modulo11Bb } from '../check-digits';
import { currentDateAAAAMMDD, padNum } from '../formatting';
import { computed, editable, fixed, inherited } from './field-helpers';
import type { ComputeContext, FileStructure, LayoutStrategy, RecordSpec } from '../types';

/** Largura fixa do registro RCB001 (spec oficial: 150 bytes). */
const LINE_LENGTH = 150;

/** DV Módulo 11 do BB, tolerante a valores fora do domínio (validação off). */
function safeModulo11Bb(raw: string | undefined, length: number): string {
  const value = (raw ?? '').trim();
  return /^\d+$/.test(value) ? modulo11Bb(padNum(value, length)) : '';
}

/** DV geral (G5.4) do código de barras: Módulo 10 sobre os 43 demais dígitos. */
function barcodeDigit(ctx: ComputeContext): string {
  const value = padNum((ctx.values.receivedAmount ?? '').trim() || '0', 11);
  const agreement = padNum((ctx.values.agreementNumber ?? '').trim() || '0', 6);
  const order = padNum((ctx.values.orderNumber ?? '').trim() || '0', 17);
  const digits = `896${value}000101${agreement}${order}`;
  return /^\d{43}$/.test(digits) ? String(modulo10(digits)) : '';
}

/** Header de arquivo — código de registro 'A'. */
const fileHeader: RecordSpec = {
  id: 'fileHeader',
  label: 'Header de Arquivo',
  fields: [
    fixed('recordType', 'Código do Registro', 1, 1, 'alfa', 'A'),
    fixed('fileCode', 'Código de Remessa', 2, 2, 'num', '2'),
    editable('agreementNumber', 'Número do Convênio', 3, 8, 'num', {
      required: true,
      hint: '6 dígitos · identificação da empresa no BB',
    }),
    // Posição 9: uso futuro (branco).
    editable('ediSequence', 'Sequencial de Retorno EDI', 10, 18, 'num', {
      defaultValue: '1',
      hint: 'Sequencial do intercâmbio eletrônico de dados',
    }),
    // Posições 19–22: uso futuro (branco).
    editable('companyName', 'Nome da Empresa / Órgão', 23, 42, 'alfa', {
      required: true,
      hint: 'Até 20 caracteres',
    }),
    editable('bankCode', 'Código do Banco', 43, 45, 'num', {
      defaultValue: '001',
      hint: '3 dígitos (default 001 — Banco do Brasil)',
    }),
    editable('bankName', 'Nome do Banco', 46, 65, 'alfa', { defaultValue: 'BANCO DO BRASIL' }),
    computed('generationDate', 'Data de Geração', 66, 73, 'num', () => currentDateAAAAMMDD()),
    editable('fileSequence', 'Número Sequencial do Arquivo', 74, 79, 'num', {
      defaultValue: '1',
      hint: 'Incrementa a cada arquivo',
    }),
    fixed('layoutVersion', 'Versão do Leiaute', 80, 81, 'num', '02'),
    // Posições 82–142: reservado uso futuro (branco).
    // Posições 143–150: vazias no comércio eletrônico (spec A14).
  ],
};

/** Registro-detalhe — código de registro 'G' (um pagamento recebido). */
const detail: RecordSpec = {
  id: 'detail',
  label: 'Registro-Detalhe',
  fields: [
    fixed('recordType', 'Código do Registro', 1, 1, 'alfa', 'G'),
    editable('agency', 'Prefixo da Agência Creditada', 2, 5, 'num', {
      required: true,
      hint: '4 dígitos',
    }),
    // DV por Módulo 11 do BB (nota 03) — calculado pelo motor.
    computed('agencyDigit', 'DV da Agência Creditada', 6, 6, 'alfa', (ctx) =>
      safeModulo11Bb(ctx.values.agency, 4),
    ),
    editable('account', 'Conta Corrente Creditada', 7, 15, 'num', {
      required: true,
      hint: 'Até 9 dígitos',
    }),
    computed('accountDigit', 'DV da Conta Creditada', 16, 16, 'alfa', (ctx) =>
      safeModulo11Bb(ctx.values.account, 9),
    ),
    // Posições 17–21: uso futuro (branco).
    editable('paymentDate', 'Data do Pagamento', 22, 29, 'num', {
      required: true,
      hint: 'AAAAMMDD',
    }),
    editable('creditDate', 'Data do Crédito', 30, 37, 'num', { hint: 'AAAAMMDD' }),
    // Código de barras (G5, posições 38–81) decomposto nos subcampos oficiais.
    fixed('barcodeProduct', 'Identificação do Produto', 38, 38, 'num', '8'),
    fixed('barcodeSegment', 'Identificação do Segmento', 39, 39, 'num', '9'),
    fixed('barcodeValueType', 'Identificador de Valor Real', 40, 40, 'num', '6'),
    computed('barcodeDigit', 'DV Geral do Código de Barras', 41, 41, 'num', barcodeDigit),
    // G5.5: espelha o Valor Recebido em 11 posições (premissa documentada).
    computed(
      'barcodeValue',
      'Valor no Código de Barras',
      42,
      52,
      'num',
      (ctx) => (ctx.values.receivedAmount ?? '').trim() || '0',
    ),
    fixed('barcodeBankCode', 'Código do BB na Compensação', 53, 56, 'num', '0001'),
    fixed('barcodeFiller', 'Preenchimento Fixo', 57, 58, 'num', '01'),
    // G5.8: reaproveita o convênio informado no header (valores mesclados).
    inherited('agreementNumber', 'Convênio RCB', 59, 64, 'num'),
    editable('orderNumber', 'Número do Pedido (refTran)', 65, 81, 'num', {
      required: true,
      hint: 'Até 17 dígitos · valor da variável refTran',
    }),
    // Correção do bug herdado do protótipo (RF-11): posições e tamanhos da spec.
    editable('receivedAmount', 'Valor Recebido', 82, 93, 'num', {
      required: true,
      hint: '12 dígitos, em centavos',
    }),
    editable('feeAmount', 'Valor da Tarifa', 94, 100, 'num', {
      hint: '7 dígitos, em centavos',
    }),
    computed('recordSequence', 'Nº Sequencial de Registro', 101, 108, 'num', (ctx) =>
      String(ctx.lineNumber),
    ),
    editable('receivingAgency', 'Prefixo da Agência Recebedora', 109, 112, 'num', {
      hint: '4 dígitos',
    }),
    // Posições 113–116: uso futuro (branco).
    editable('collectionMethod', 'Meio de Arrecadação', 117, 117, 'num', {
      defaultValue: '3',
      hint: '1 = Caixa · 2 = Eletrônica · 3 = Internet',
    }),
    editable('electronicAuth', 'Autenticação Eletrônica', 118, 140, 'alfa', {
      hint: 'Até 23 caracteres',
    }),
    editable('paymentMethod', 'Forma de Recebimento', 141, 141, 'num', {
      defaultValue: '1',
      hint: '1 = Dinheiro · 2 = Cheque · 3 = Não identificada',
    }),
    // Posições 142–150: uso futuro (branco).
  ],
};

/** Trailer — código de registro 'Z', com totalizadores automáticos (RF-07). */
const fileTrailer: RecordSpec = {
  id: 'fileTrailer',
  label: 'Trailer de Arquivo',
  fields: [
    fixed('recordType', 'Código do Registro', 1, 1, 'alfa', 'Z'),
    // Total de registros INCLUSIVE header e trailer (spec Z2).
    computed('totalRecords', 'Total de Registros do Arquivo', 2, 7, 'num', (ctx) =>
      String(ctx.totalLines),
    ),
    computed('totalReceived', 'Valor Total Recebido', 8, 24, 'num', (ctx) =>
      ctx.sumOfDetailField('receivedAmount').toString(),
    ),
    // Posições 25–150: livres (spec Z4).
  ],
};

const structure: FileStructure = {
  fileHeader,
  detailSegments: [detail],
  fileTrailer,
};

/** Estratégia RCB001, plugada no registry de leiautes. */
export const rcb001Strategy: LayoutStrategy = {
  id: 'RCB001',
  label: 'RCB001',
  description: 'Retorno BB de débito em conta via Internet (150 posições, registros A/G/Z)',
  lineLength: LINE_LENGTH,
  kinds: ['retorno'],
  fileExtension: () => '.ret',
  structure: () => structure,
};
