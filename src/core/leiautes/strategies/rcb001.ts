/**
 * Estratégia RCB001 — arquivo de retorno de recebimento de cobrança.
 *
 * PREMISSAS DO LEIAUTE (risco R1 do PRD — documentar por leiaute):
 * - Registro de 150 posições, um registro por linha, no modelo do protótipo
 *   "Patinho Feio": header (tipo 0), registros-detalhe (tipo 1) e trailer
 *   (tipo 9), com sequencial de 6 posições no fim de cada registro.
 * - "Valor Recebido" com 12 dígitos e "Valor da Tarifa" com 10 dígitos, em
 *   centavos — os dois campos que carregavam bugs no protótipo (RF-11) e que
 *   aqui têm posição e validação explícitas.
 * - Suporta apenas RETORNO (paridade com o protótipo); remessa não existe
 *   neste leiaute.
 * - Datas no formato DDMMAAAA.
 */

import { currentDateDDMMAAAA } from '../formatting';
import { computed, editable, fixed } from './field-helpers';
import type { FileStructure, LayoutStrategy, RecordSpec } from '../types';

/** Largura fixa do registro RCB001 (premissa documentada acima). */
const LINE_LENGTH = 150;

/** Header de arquivo — identificação do banco, conta e empresa. */
const fileHeader: RecordSpec = {
  id: 'fileHeader',
  label: 'Header de Arquivo',
  fields: [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '0'),
    fixed('fileCode', 'Código de Retorno', 2, 2, 'num', '2'),
    fixed('fileLiteral', 'Literal de Retorno', 3, 9, 'alfa', 'RETORNO'),
    fixed('serviceCode', 'Código do Serviço', 10, 11, 'num', '01'),
    fixed('serviceLiteral', 'Literal do Serviço', 12, 19, 'alfa', 'COBRANCA'),
    editable('bankCode', 'Código do Banco', 20, 22, 'num', {
      required: true,
      defaultValue: '341',
      hint: '3 dígitos (ex.: 341)',
    }),
    editable('bankName', 'Nome do Banco', 23, 52, 'alfa', { defaultValue: 'BANCO TESTE' }),
    editable('agency', 'Agência', 53, 56, 'num', { required: true, hint: '4 dígitos' }),
    editable('agencyDigit', 'DV da Agência', 57, 57, 'num'),
    editable('account', 'Conta Corrente', 58, 65, 'num', { required: true, hint: '8 dígitos' }),
    editable('accountDigit', 'DV da Conta', 66, 66, 'num'),
    editable('companyName', 'Nome da Empresa', 67, 96, 'alfa', {
      required: true,
      hint: 'Até 30 caracteres',
    }),
    computed('generationDate', 'Data de Geração', 97, 104, 'num', () => currentDateDDMMAAAA()),
    computed('sequence', 'Sequencial do Registro', 145, 150, 'num', (ctx) =>
      String(ctx.lineNumber),
    ),
  ],
};

/** Registro-detalhe — um título recebido, com valor recebido e tarifa. */
const detail: RecordSpec = {
  id: 'detail',
  label: 'Registro-Detalhe',
  fields: [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '1'),
    editable('ourNumber', 'Nosso Número', 2, 13, 'num', { required: true, hint: '12 dígitos' }),
    editable('yourNumber', 'Seu Número', 14, 23, 'alfa', { hint: 'Identificação da empresa' }),
    editable('occurrenceCode', 'Código de Ocorrência', 24, 25, 'num', {
      defaultValue: '06',
      hint: '06 = liquidação',
    }),
    editable('occurrenceDate', 'Data da Ocorrência', 26, 33, 'num', {
      required: true,
      hint: 'DDMMAAAA',
    }),
    editable('dueDate', 'Data de Vencimento', 34, 41, 'num', { hint: 'DDMMAAAA' }),
    editable('titleAmount', 'Valor do Título', 42, 53, 'num', {
      required: true,
      hint: '12 dígitos, em centavos',
    }),
    // Correção do bug herdado do protótipo (RF-11): posição e tamanho fixados.
    editable('receivedAmount', 'Valor Recebido', 54, 65, 'num', {
      required: true,
      hint: '12 dígitos, em centavos',
    }),
    // Correção do bug herdado do protótipo (RF-11): 10 dígitos, em centavos.
    editable('feeAmount', 'Valor da Tarifa', 66, 75, 'num', {
      hint: '10 dígitos, em centavos',
    }),
    editable('creditDate', 'Data do Crédito', 76, 83, 'num', { hint: 'DDMMAAAA' }),
    computed('sequence', 'Sequencial do Registro', 145, 150, 'num', (ctx) =>
      String(ctx.lineNumber),
    ),
  ],
};

/** Trailer — totalizadores calculados automaticamente (RF-07). */
const fileTrailer: RecordSpec = {
  id: 'fileTrailer',
  label: 'Trailer de Arquivo',
  fields: [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '9'),
    fixed('fileCode', 'Código de Retorno', 2, 2, 'num', '2'),
    fixed('serviceCode', 'Código do Serviço', 3, 4, 'num', '01'),
    // Reaproveita o banco preenchido no header (valores mesclados na geração).
    { key: 'bankCode', label: 'Código do Banco', start: 5, end: 7, type: 'num', editable: false },
    computed('detailCount', 'Quantidade de Títulos', 8, 13, 'num', (ctx) =>
      String(ctx.detailCount),
    ),
    computed('totalReceived', 'Valor Total Recebido', 14, 27, 'num', (ctx) =>
      ctx.sumOfDetailField('receivedAmount').toString(),
    ),
    computed('totalTitles', 'Valor Total dos Títulos', 28, 41, 'num', (ctx) =>
      ctx.sumOfDetailField('titleAmount').toString(),
    ),
    computed('sequence', 'Sequencial do Registro', 145, 150, 'num', (ctx) =>
      String(ctx.lineNumber),
    ),
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
  description: 'Retorno de recebimento de cobrança (150 posições)',
  lineLength: LINE_LENGTH,
  kinds: ['retorno'],
  fileExtension: () => '.ret',
  structure: () => structure,
};
