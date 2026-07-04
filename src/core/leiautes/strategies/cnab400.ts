/**
 * Estratégia CNAB400 — cobrança bancária, padrão legado (400 posições).
 *
 * Estrutura: Header (tipo 0) → registros-detalhe (tipo 1) → Trailer (tipo 9),
 * com sequencial de 6 posições no fim de cada registro (395–400).
 *
 * PREMISSAS DO LEIAUTE (risco R1 do PRD — documentar por leiaute):
 * - Base: leiaute CNAB400 de cobrança no formato popularizado pelos grandes
 *   bancos (Itaú/Bradesco). Bancos específicos divergem em campos de uso
 *   exclusivo — variações devem virar extensão desta estratégia.
 * - Datas no formato DDMMAA (6 dígitos, padrão do CNAB400).
 * - Valores em centavos, sem separadores (13 dígitos).
 * - Campos de juros/desconto/IOF/abatimento saem zerados para manter o
 *   formulário enxuto.
 */

import { currentDateDDMMAA } from '../formatting';
import { computed, editable, fixed, inherited } from './field-helpers';
import type { ComputeContext, FileKind, FileStructure, LayoutStrategy, RecordSpec } from '../types';

const LINE_LENGTH = 400;

/** Sequencial do registro no arquivo (posições 395–400 de todo registro). */
function lineSequence(ctx: ComputeContext): string {
  return String(ctx.lineNumber);
}

/** Header — registro tipo 0. */
function buildFileHeader(kind: FileKind): RecordSpec {
  return {
    id: 'fileHeader',
    label: 'Header de Arquivo',
    fields: [
      fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '0'),
      fixed('fileCode', 'Código Remessa/Retorno', 2, 2, 'num', kind === 'remessa' ? '1' : '2'),
      fixed('fileLiteral', 'Literal', 3, 9, 'alfa', kind === 'remessa' ? 'REMESSA' : 'RETORNO'),
      fixed('serviceCode', 'Código do Serviço', 10, 11, 'num', '01'),
      fixed('serviceLiteral', 'Literal do Serviço', 12, 26, 'alfa', 'COBRANCA'),
      editable('agency', 'Agência', 27, 30, 'num', { required: true, hint: '4 dígitos' }),
      fixed('agencyFiller', 'Zeros', 31, 32, 'num', '00'),
      editable('account', 'Conta Corrente', 33, 37, 'num', { required: true, hint: '5 dígitos' }),
      editable('accountDigit', 'DV da Conta', 38, 38, 'num'),
      editable('companyName', 'Nome da Empresa', 47, 76, 'alfa', {
        required: true,
        hint: 'Até 30 caracteres',
      }),
      editable('bankCode', 'Código do Banco', 77, 79, 'num', {
        required: true,
        defaultValue: '341',
        hint: '3 dígitos (ex.: 341)',
      }),
      editable('bankName', 'Nome do Banco', 80, 94, 'alfa', { defaultValue: 'BANCO TESTE' }),
      computed('generationDate', 'Data de Geração', 95, 100, 'num', () => currentDateDDMMAA()),
      computed('sequence', 'Sequencial do Registro', 395, 400, 'num', lineSequence),
    ],
  };
}

/** Detalhe de remessa — título enviado ao banco. */
const remessaDetail: RecordSpec = {
  id: 'detail',
  label: 'Registro-Detalhe (Título)',
  fields: [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '1'),
    editable('companyDocType', 'Tipo de Inscrição da Empresa', 2, 3, 'num', {
      defaultValue: '02',
      hint: '01 = CPF · 02 = CNPJ',
    }),
    editable('companyDocument', 'CPF/CNPJ da Empresa', 4, 17, 'num', {
      required: true,
      hint: 'Até 14 dígitos, sem máscara',
    }),
    inherited('agency', 'Agência', 18, 21, 'num'),
    fixed('agencyFiller', 'Zeros', 22, 23, 'num', '00'),
    inherited('account', 'Conta Corrente', 24, 28, 'num'),
    inherited('accountDigit', 'DV da Conta', 29, 29, 'num'),
    editable('titleId', 'Identificação na Empresa', 38, 62, 'alfa', {
      hint: 'Uso livre da empresa ("seu número")',
    }),
    editable('ourNumber', 'Nosso Número', 63, 70, 'num', { required: true, hint: '8 dígitos' }),
    editable('walletNumber', 'Número da Carteira', 84, 86, 'num', { defaultValue: '109' }),
    fixed('walletCode', 'Código da Carteira', 108, 108, 'alfa', 'I'),
    editable('occurrenceCode', 'Código de Ocorrência', 109, 110, 'num', {
      defaultValue: '01',
      hint: '01 = remessa de título',
    }),
    editable('documentNumber', 'Número do Documento', 111, 120, 'alfa', {
      hint: 'Nº da duplicata/nota',
    }),
    editable('dueDate', 'Data de Vencimento', 121, 126, 'num', {
      required: true,
      hint: 'DDMMAA',
    }),
    editable('titleAmount', 'Valor do Título', 127, 139, 'num', {
      required: true,
      hint: 'Em centavos (ex.: 150000 = R$ 1.500,00)',
    }),
    editable('collectingBank', 'Banco Cobrador', 140, 142, 'num', { defaultValue: '341' }),
    fixed('collectingAgency', 'Agência Cobradora', 143, 147, 'num', '0'),
    editable('titleKind', 'Espécie do Título', 148, 149, 'num', {
      defaultValue: '01',
      hint: '01 = duplicata mercantil',
    }),
    fixed('acceptance', 'Aceite', 150, 150, 'alfa', 'N'),
    editable('issueDate', 'Data de Emissão', 151, 156, 'num', { hint: 'DDMMAA' }),
    // Juros, desconto, IOF e abatimento zerados (premissa documentada).
    fixed('interestPerDay', 'Juros ao Dia', 161, 173, 'num', '0'),
    fixed('discountDate', 'Data de Desconto', 174, 179, 'num', '0'),
    fixed('discountAmount', 'Valor de Desconto', 180, 192, 'num', '0'),
    fixed('iofAmount', 'Valor do IOF', 193, 205, 'num', '0'),
    fixed('abatementAmount', 'Valor de Abatimento', 206, 218, 'num', '0'),
    editable('payerDocType', 'Tipo de Inscrição do Pagador', 219, 220, 'num', {
      defaultValue: '01',
      hint: '01 = CPF · 02 = CNPJ',
    }),
    editable('payerDocument', 'CPF/CNPJ do Pagador', 221, 234, 'num', {
      required: true,
      hint: 'Sem máscara',
    }),
    editable('payerName', 'Nome do Pagador', 235, 264, 'alfa', {
      required: true,
      hint: 'Até 30 caracteres',
    }),
    editable('payerAddress', 'Endereço do Pagador', 275, 314, 'alfa'),
    editable('payerNeighborhood', 'Bairro', 315, 326, 'alfa'),
    editable('payerZip', 'CEP', 327, 334, 'num', { hint: '8 dígitos' }),
    editable('payerCity', 'Cidade', 335, 349, 'alfa'),
    editable('payerState', 'UF', 350, 351, 'alfa', { hint: 'Ex.: SP' }),
    computed('sequence', 'Sequencial do Registro', 395, 400, 'num', lineSequence),
  ],
};

/** Detalhe de retorno — ocorrência sobre um título (liquidação etc.). */
const retornoDetail: RecordSpec = {
  id: 'detail',
  label: 'Registro-Detalhe (Ocorrência)',
  fields: [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '1'),
    editable('companyDocType', 'Tipo de Inscrição da Empresa', 2, 3, 'num', {
      defaultValue: '02',
      hint: '01 = CPF · 02 = CNPJ',
    }),
    editable('companyDocument', 'CPF/CNPJ da Empresa', 4, 17, 'num', {
      required: true,
      hint: 'Até 14 dígitos, sem máscara',
    }),
    inherited('agency', 'Agência', 18, 21, 'num'),
    fixed('agencyFiller', 'Zeros', 22, 23, 'num', '00'),
    inherited('account', 'Conta Corrente', 24, 28, 'num'),
    inherited('accountDigit', 'DV da Conta', 29, 29, 'num'),
    editable('titleId', 'Identificação na Empresa', 38, 62, 'alfa', {
      hint: 'Uso livre da empresa ("seu número")',
    }),
    editable('ourNumber', 'Nosso Número', 63, 70, 'num', { required: true, hint: '8 dígitos' }),
    editable('walletNumber', 'Número da Carteira', 83, 85, 'num', { defaultValue: '109' }),
    fixed('walletCode', 'Código da Carteira', 108, 108, 'alfa', 'I'),
    editable('occurrenceCode', 'Código de Ocorrência', 109, 110, 'num', {
      required: true,
      defaultValue: '06',
      hint: '06 = liquidação normal',
    }),
    editable('occurrenceDate', 'Data da Ocorrência', 111, 116, 'num', {
      required: true,
      hint: 'DDMMAA · data do pagamento',
    }),
    editable('documentNumber', 'Número do Documento', 117, 126, 'alfa'),
    editable('dueDate', 'Data de Vencimento', 147, 152, 'num', { hint: 'DDMMAA' }),
    editable('titleAmount', 'Valor do Título', 153, 165, 'num', {
      required: true,
      hint: 'Em centavos',
    }),
    editable('collectingBank', 'Banco Cobrador', 166, 168, 'num', { defaultValue: '341' }),
    fixed('collectingAgency', 'Agência Cobradora', 169, 172, 'num', '0'),
    // Correção do bug herdado do protótipo (RF-11): Valor da Tarifa explícito.
    editable('feeAmount', 'Valor da Tarifa', 176, 188, 'num', {
      hint: 'Em centavos · tarifa de cobrança',
    }),
    fixed('otherExpenses', 'Outras Despesas', 189, 201, 'num', '0'),
    fixed('interestAmount', 'Juros de Mora', 267, 279, 'num', '0'),
    // Correção do bug herdado do protótipo (RF-11): Valor Recebido explícito.
    editable('receivedAmount', 'Valor Recebido (Principal)', 254, 266, 'num', {
      required: true,
      hint: 'Em centavos · valor efetivamente pago',
    }),
    editable('creditDate', 'Data do Crédito', 296, 301, 'num', { hint: 'DDMMAA' }),
    computed('sequence', 'Sequencial do Registro', 395, 400, 'num', lineSequence),
  ],
};

/** Trailer — registro tipo 9. */
function buildFileTrailer(kind: FileKind): RecordSpec {
  const fields = [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '9'),
    computed('sequence', 'Sequencial do Registro', 395, 400, 'num', lineSequence),
  ];
  if (kind === 'retorno') {
    // No retorno o trailer identifica o serviço e traz totalizadores (RF-07).
    fields.splice(
      1,
      0,
      fixed('fileCode', 'Código de Retorno', 2, 2, 'num', '2'),
      fixed('serviceCode', 'Código do Serviço', 3, 4, 'num', '01'),
      inherited('bankCode', 'Código do Banco', 5, 7, 'num'),
      computed('titleCount', 'Quantidade de Títulos', 18, 25, 'num', (ctx) =>
        String(ctx.detailCount),
      ),
      computed('titleTotal', 'Valor Total dos Títulos', 26, 39, 'num', (ctx) =>
        ctx.sumOfDetailField('titleAmount').toString(),
      ),
    );
  }
  return { id: 'fileTrailer', label: 'Trailer de Arquivo', fields };
}

/** Estratégia CNAB400, plugada no registry de leiautes. */
export const cnab400Strategy: LayoutStrategy = {
  id: 'CNAB400',
  label: 'CNAB400',
  description: 'Cobrança legada 400 posições — header, detalhes (tipo 1) e trailer',
  lineLength: LINE_LENGTH,
  kinds: ['remessa', 'retorno'],
  fileExtension: (kind) => (kind === 'remessa' ? '.rem' : '.ret'),
  structure: (kind) => {
    const structure: FileStructure = {
      fileHeader: buildFileHeader(kind),
      detailSegments: [kind === 'remessa' ? remessaDetail : retornoDetail],
      fileTrailer: buildFileTrailer(kind),
    };
    return structure;
  },
};
