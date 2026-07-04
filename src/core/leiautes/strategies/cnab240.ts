/**
 * Estratégia CNAB240 — cobrança bancária, padrão FEBRABAN (240 posições).
 *
 * Estrutura: Header de Arquivo (0) → Header de Lote (1) → detalhes em
 * segmentos (3) → Trailer de Lote (5) → Trailer de Arquivo (9).
 * Cada registro-detalhe lógico vira DUAS linhas: segmentos P+Q na remessa
 * (dados do título + dados do pagador) e T+U no retorno (título + valores
 * da ocorrência).
 *
 * PREMISSAS DO LEIAUTE (risco R1 do PRD — documentar por leiaute):
 * - Base: manual FEBRABAN de cobrança, versão de layout '103' (arquivo) e
 *   '060' (lote). Bancos específicos podem divergir em campos de uso
 *   exclusivo — variações devem virar extensão desta estratégia.
 * - Arquivo com UM lote de serviço (suficiente para massa de teste; múltiplos
 *   lotes ficam para release futura).
 * - Campos de juros/descontos/IOF são emitidos zerados (não editáveis) para
 *   manter o formulário enxuto; o essencial de cobrança é parametrizável.
 * - Datas no formato DDMMAAAA; valores em centavos, sem separadores.
 */

import { currentDateDDMMAAAA, currentTimeHHMMSS } from '../formatting';
import { computed, editable, fixed, inherited } from './field-helpers';
import type { ComputeContext, FileKind, FileStructure, LayoutStrategy, RecordSpec } from '../types';

const LINE_LENGTH = 240;

/** Sequencial do registro dentro do lote (linhas de detalhe começam na 3ª). */
function detailSequence(ctx: ComputeContext): string {
  return String(ctx.lineNumber - 2);
}

/** Header de Arquivo — registro tipo 0. */
function buildFileHeader(kind: FileKind): RecordSpec {
  return {
    id: 'fileHeader',
    label: 'Header de Arquivo',
    fields: [
      editable('bankCode', 'Código do Banco', 1, 3, 'num', {
        required: true,
        defaultValue: '341',
        hint: '3 dígitos (ex.: 341)',
      }),
      fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0000'),
      fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '0'),
      editable('companyDocType', 'Tipo de Inscrição', 18, 18, 'num', {
        defaultValue: '2',
        hint: '1 = CPF · 2 = CNPJ',
      }),
      editable('companyDocument', 'CPF/CNPJ da Empresa', 19, 32, 'num', {
        required: true,
        hint: 'Até 14 dígitos, sem máscara',
      }),
      editable('agreementCode', 'Código do Convênio', 33, 52, 'alfa', {
        hint: 'Conforme contrato com o banco',
      }),
      editable('agency', 'Agência', 53, 57, 'num', { required: true, hint: 'Até 5 dígitos' }),
      editable('agencyDigit', 'DV da Agência', 58, 58, 'alfa'),
      editable('account', 'Conta Corrente', 59, 70, 'num', {
        required: true,
        hint: 'Até 12 dígitos',
      }),
      editable('accountDigit', 'DV da Conta', 71, 71, 'alfa'),
      editable('companyName', 'Nome da Empresa', 73, 102, 'alfa', {
        required: true,
        hint: 'Até 30 caracteres',
      }),
      editable('bankName', 'Nome do Banco', 103, 132, 'alfa', { defaultValue: 'BANCO TESTE' }),
      // 1 = remessa · 2 = retorno (posição 143, "código remessa/retorno")
      fixed('fileCode', 'Código Remessa/Retorno', 143, 143, 'num', kind === 'remessa' ? '1' : '2'),
      computed('generationDate', 'Data de Geração', 144, 151, 'num', () => currentDateDDMMAAAA()),
      computed('generationTime', 'Hora de Geração', 152, 157, 'num', () => currentTimeHHMMSS()),
      editable('fileSequence', 'Número Sequencial do Arquivo (NSA)', 158, 163, 'num', {
        defaultValue: '1',
        hint: 'Incrementa a cada arquivo trocado com o banco',
      }),
      fixed('layoutVersion', 'Versão do Layout', 164, 166, 'num', '103'),
      fixed('density', 'Densidade de Gravação', 167, 171, 'num', '01600'),
    ],
  };
}

/** Header de Lote — registro tipo 1. */
function buildBatchHeader(kind: FileKind): RecordSpec {
  return {
    id: 'batchHeader',
    label: 'Header de Lote',
    fields: [
      inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
      fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0001'),
      fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '1'),
      // R = remessa · T = retorno (tipo de operação do lote)
      fixed('operationType', 'Tipo de Operação', 9, 9, 'alfa', kind === 'remessa' ? 'R' : 'T'),
      fixed('serviceType', 'Tipo de Serviço', 10, 11, 'num', '01'),
      fixed('batchLayoutVersion', 'Versão do Layout do Lote', 14, 16, 'num', '060'),
      inherited('companyDocType', 'Tipo de Inscrição', 18, 18, 'num'),
      inherited('companyDocument', 'CPF/CNPJ da Empresa', 19, 33, 'num'),
      inherited('agreementCode', 'Código do Convênio', 34, 53, 'alfa'),
      inherited('agency', 'Agência', 54, 58, 'num'),
      inherited('agencyDigit', 'DV da Agência', 59, 59, 'alfa'),
      inherited('account', 'Conta Corrente', 60, 71, 'num'),
      inherited('accountDigit', 'DV da Conta', 72, 72, 'alfa'),
      inherited('companyName', 'Nome da Empresa', 74, 103, 'alfa'),
      editable('message1', 'Mensagem 1', 104, 143, 'alfa', {
        hint: 'Mensagem livre para o bloqueto',
      }),
      editable('message2', 'Mensagem 2', 144, 183, 'alfa'),
      editable('remittanceNumber', 'Número da Remessa/Retorno', 184, 191, 'num', {
        defaultValue: '1',
      }),
      computed('recordDate', 'Data de Gravação', 192, 199, 'num', () => currentDateDDMMAAAA()),
    ],
  };
}

/** Segmento P (remessa) — dados do título. */
const segmentP: RecordSpec = {
  id: 'segmentP',
  label: 'Segmento P — Título',
  fields: [
    inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
    fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0001'),
    fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '3'),
    computed('detailSequence', 'Sequencial no Lote', 9, 13, 'num', detailSequence),
    fixed('segmentCode', 'Código do Segmento', 14, 14, 'alfa', 'P'),
    editable('movementCode', 'Código de Movimento', 16, 17, 'num', {
      defaultValue: '01',
      hint: '01 = entrada de títulos',
    }),
    inherited('agency', 'Agência', 18, 22, 'num'),
    inherited('agencyDigit', 'DV da Agência', 23, 23, 'alfa'),
    inherited('account', 'Conta Corrente', 24, 35, 'num'),
    inherited('accountDigit', 'DV da Conta', 36, 36, 'alfa'),
    editable('ourNumber', 'Nosso Número', 38, 57, 'alfa', {
      required: true,
      hint: 'Identificação do título no banco (com DV)',
    }),
    editable('walletCode', 'Carteira', 58, 58, 'num', { defaultValue: '1' }),
    fixed('registrationType', 'Cadastramento', 59, 59, 'num', '1'),
    fixed('docType', 'Tipo de Documento', 60, 60, 'alfa', '1'),
    editable('documentNumber', 'Número do Documento', 63, 77, 'alfa', {
      hint: 'Nº da duplicata/nota',
    }),
    editable('dueDate', 'Data de Vencimento', 78, 85, 'num', {
      required: true,
      hint: 'DDMMAAAA',
    }),
    editable('titleAmount', 'Valor do Título', 86, 100, 'num', {
      required: true,
      hint: 'Em centavos (ex.: 150000 = R$ 1.500,00)',
    }),
    editable('titleKind', 'Espécie do Título', 107, 108, 'num', {
      defaultValue: '02',
      hint: '02 = duplicata mercantil',
    }),
    fixed('acceptance', 'Aceite', 109, 109, 'alfa', 'N'),
    editable('issueDate', 'Data de Emissão', 110, 117, 'num', { hint: 'DDMMAAAA' }),
    // Juros, descontos, IOF e abatimento saem zerados (premissa documentada).
    fixed('interestCode', 'Código de Juros', 118, 118, 'num', '3'),
    fixed('interestDate', 'Data de Juros', 119, 126, 'num', '0'),
    fixed('interestAmount', 'Valor de Juros', 127, 141, 'num', '0'),
    fixed('discountCode', 'Código de Desconto', 142, 142, 'num', '3'),
    fixed('discountDate', 'Data de Desconto', 143, 150, 'num', '0'),
    fixed('discountAmount', 'Valor de Desconto', 151, 165, 'num', '0'),
    fixed('iofAmount', 'Valor do IOF', 166, 180, 'num', '0'),
    fixed('abatementAmount', 'Valor de Abatimento', 181, 195, 'num', '0'),
    editable('titleId', 'Identificação na Empresa', 196, 220, 'alfa', {
      hint: 'Uso livre da empresa ("seu número")',
    }),
    fixed('protestCode', 'Código de Protesto', 221, 221, 'num', '3'),
    fixed('protestDays', 'Prazo de Protesto', 222, 223, 'num', '0'),
    fixed('writeOffCode', 'Código de Baixa', 224, 224, 'num', '1'),
    fixed('writeOffDays', 'Prazo de Baixa', 225, 227, 'num', '0'),
    fixed('currencyCode', 'Código da Moeda', 228, 229, 'num', '09'),
  ],
};

/** Segmento Q (remessa) — dados do pagador (sacado). */
const segmentQ: RecordSpec = {
  id: 'segmentQ',
  label: 'Segmento Q — Pagador',
  fields: [
    inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
    fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0001'),
    fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '3'),
    computed('detailSequence', 'Sequencial no Lote', 9, 13, 'num', detailSequence),
    fixed('segmentCode', 'Código do Segmento', 14, 14, 'alfa', 'Q'),
    // Mesmo movimento do segmento P (mesma chave — preenchido uma vez só).
    inherited('movementCode', 'Código de Movimento', 16, 17, 'num'),
    editable('payerDocType', 'Tipo de Inscrição do Pagador', 18, 18, 'num', {
      defaultValue: '1',
      hint: '1 = CPF · 2 = CNPJ',
    }),
    editable('payerDocument', 'CPF/CNPJ do Pagador', 19, 33, 'num', {
      required: true,
      hint: 'Sem máscara',
    }),
    editable('payerName', 'Nome do Pagador', 34, 73, 'alfa', {
      required: true,
      hint: 'Até 40 caracteres',
    }),
    editable('payerAddress', 'Endereço do Pagador', 74, 113, 'alfa'),
    editable('payerNeighborhood', 'Bairro', 114, 128, 'alfa'),
    editable('payerZip', 'CEP', 129, 136, 'num', { hint: '8 dígitos' }),
    editable('payerCity', 'Cidade', 137, 151, 'alfa'),
    editable('payerState', 'UF', 152, 153, 'alfa', { hint: 'Ex.: SP' }),
    fixed('guarantorDocType', 'Tipo de Inscrição do Avalista', 154, 154, 'num', '0'),
    fixed('guarantorDocument', 'CPF/CNPJ do Avalista', 155, 169, 'num', '0'),
  ],
};

/** Segmento T (retorno) — identificação do título e da ocorrência. */
const segmentT: RecordSpec = {
  id: 'segmentT',
  label: 'Segmento T — Título',
  fields: [
    inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
    fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0001'),
    fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '3'),
    computed('detailSequence', 'Sequencial no Lote', 9, 13, 'num', detailSequence),
    fixed('segmentCode', 'Código do Segmento', 14, 14, 'alfa', 'T'),
    editable('movementCode', 'Código de Movimento', 16, 17, 'num', {
      defaultValue: '06',
      hint: '06 = liquidação',
    }),
    inherited('agency', 'Agência', 18, 22, 'num'),
    inherited('agencyDigit', 'DV da Agência', 23, 23, 'alfa'),
    inherited('account', 'Conta Corrente', 24, 35, 'num'),
    inherited('accountDigit', 'DV da Conta', 36, 36, 'alfa'),
    editable('ourNumber', 'Nosso Número', 38, 57, 'alfa', {
      required: true,
      hint: 'Identificação do título no banco (com DV)',
    }),
    editable('walletCode', 'Carteira', 58, 58, 'num', { defaultValue: '1' }),
    editable('documentNumber', 'Número do Documento', 59, 73, 'alfa'),
    editable('dueDate', 'Data de Vencimento', 74, 81, 'num', { hint: 'DDMMAAAA' }),
    editable('titleAmount', 'Valor do Título', 82, 96, 'num', {
      required: true,
      hint: 'Em centavos',
    }),
    editable('collectingBank', 'Banco Cobrador', 97, 99, 'num', { defaultValue: '341' }),
    editable('collectingAgency', 'Agência Cobradora', 100, 104, 'num'),
    editable('titleId', 'Identificação na Empresa', 106, 130, 'alfa', {
      hint: 'Uso livre da empresa ("seu número")',
    }),
    fixed('currencyCode', 'Código da Moeda', 131, 132, 'num', '09'),
    editable('payerDocType', 'Tipo de Inscrição do Pagador', 133, 133, 'num', {
      defaultValue: '1',
      hint: '1 = CPF · 2 = CNPJ',
    }),
    editable('payerDocument', 'CPF/CNPJ do Pagador', 134, 148, 'num', { hint: 'Sem máscara' }),
    editable('payerName', 'Nome do Pagador', 149, 188, 'alfa'),
    // Correção do bug herdado do protótipo (RF-11): Valor da Tarifa explícito.
    editable('feeAmount', 'Valor da Tarifa', 199, 213, 'num', {
      hint: 'Em centavos · tarifas/custas da ocorrência',
    }),
  ],
};

/** Segmento U (retorno) — valores da ocorrência (pagamento). */
const segmentU: RecordSpec = {
  id: 'segmentU',
  label: 'Segmento U — Valores',
  fields: [
    inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
    fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0001'),
    fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '3'),
    computed('detailSequence', 'Sequencial no Lote', 9, 13, 'num', detailSequence),
    fixed('segmentCode', 'Código do Segmento', 14, 14, 'alfa', 'U'),
    // Mesmo movimento do segmento T (mesma chave — preenchido uma vez só).
    inherited('movementCode', 'Código de Movimento', 16, 17, 'num'),
    editable('accrualsAmount', 'Juros/Multa/Encargos', 18, 32, 'num', {
      defaultValue: '0',
      hint: 'Em centavos',
    }),
    fixed('discountAmount', 'Valor do Desconto', 33, 47, 'num', '0'),
    fixed('abatementAmount', 'Valor do Abatimento', 48, 62, 'num', '0'),
    fixed('iofAmount', 'Valor do IOF', 63, 77, 'num', '0'),
    // Correção do bug herdado do protótipo (RF-11): Valor Recebido explícito.
    editable('receivedAmount', 'Valor Recebido (Pago)', 78, 92, 'num', {
      required: true,
      hint: 'Em centavos',
    }),
    // Valor líquido calculado automaticamente: recebido − tarifa (RF-07).
    computed('netAmount', 'Valor Líquido Creditado', 93, 107, 'num', (ctx) => {
      const received = /^\d+$/.test(ctx.values.receivedAmount ?? '')
        ? BigInt(ctx.values.receivedAmount as string)
        : 0n;
      const fee = /^\d+$/.test(ctx.values.feeAmount ?? '')
        ? BigInt(ctx.values.feeAmount as string)
        : 0n;
      const net = received - fee;
      return (net > 0n ? net : 0n).toString();
    }),
    fixed('otherExpenses', 'Outras Despesas', 108, 122, 'num', '0'),
    fixed('otherCredits', 'Outros Créditos', 123, 137, 'num', '0'),
    editable('occurrenceDate', 'Data da Ocorrência', 138, 145, 'num', {
      required: true,
      hint: 'DDMMAAAA · data do pagamento',
    }),
    editable('creditDate', 'Data do Crédito', 146, 153, 'num', { hint: 'DDMMAAAA' }),
  ],
};

/** Trailer de Lote — registro tipo 5, com totalizadores automáticos. */
function buildBatchTrailer(kind: FileKind): RecordSpec {
  return {
    id: 'batchTrailer',
    label: 'Trailer de Lote',
    fields: [
      inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
      fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '0001'),
      fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '5'),
      // Header do lote + segmentos dos detalhes + este trailer (RF-07).
      computed('batchRecordCount', 'Quantidade de Registros do Lote', 18, 23, 'num', (ctx) =>
        String(ctx.detailCount * 2 + 2),
      ),
      computed('titleCount', 'Quantidade de Títulos', 24, 29, 'num', (ctx) =>
        String(ctx.detailCount),
      ),
      computed('titleTotal', 'Valor Total dos Títulos', 30, 46, 'num', (ctx) =>
        ctx.sumOfDetailField('titleAmount').toString(),
      ),
      // No retorno, totaliza também o valor efetivamente recebido.
      ...(kind === 'retorno'
        ? [
            computed('receivedTotal', 'Valor Total Recebido', 47, 63, 'num', (ctx) =>
              ctx.sumOfDetailField('receivedAmount').toString(),
            ),
          ]
        : []),
    ],
  };
}

/** Trailer de Arquivo — registro tipo 9. */
const fileTrailer: RecordSpec = {
  id: 'fileTrailer',
  label: 'Trailer de Arquivo',
  fields: [
    inherited('bankCode', 'Código do Banco', 1, 3, 'num'),
    fixed('batchNumber', 'Lote de Serviço', 4, 7, 'num', '9999'),
    fixed('recordType', 'Tipo de Registro', 8, 8, 'num', '9'),
    fixed('batchCount', 'Quantidade de Lotes', 18, 23, 'num', '1'),
    computed('recordCount', 'Quantidade de Registros', 24, 29, 'num', (ctx) =>
      String(ctx.totalLines),
    ),
  ],
};

/** Estratégia CNAB240, plugada no registry de leiautes. */
export const cnab240Strategy: LayoutStrategy = {
  id: 'CNAB240',
  label: 'CNAB240',
  description: 'Cobrança FEBRABAN 240 posições — segmentos P/Q (remessa) e T/U (retorno)',
  lineLength: LINE_LENGTH,
  kinds: ['remessa', 'retorno'],
  fileExtension: (kind) => (kind === 'remessa' ? '.rem' : '.ret'),
  structure: (kind) => {
    const structure: FileStructure = {
      fileHeader: buildFileHeader(kind),
      batchHeader: buildBatchHeader(kind),
      detailSegments: kind === 'remessa' ? [segmentP, segmentQ] : [segmentT, segmentU],
      batchTrailer: buildBatchTrailer(kind),
      fileTrailer,
    };
    return structure;
  },
};
