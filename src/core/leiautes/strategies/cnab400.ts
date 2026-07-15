/**
 * Estratégia CNAB400 — cobrança bancária Itaú (400 posições).
 *
 * Fonte oficial: Itaú — "Cobrança CNAB 400 · Layout de Arquivo — Cobrança
 * 400 bytes", janeiro/2017.
 *
 * Estrutura: Header (tipo 0) → registros-detalhe (tipo 1) → Trailer (tipo 9),
 * com sequencial de 6 posições no fim de cada registro (395–400).
 *
 * PREMISSAS DO LEIAUTE (risco R1 do PRD — documentar por leiaute):
 * - Base: manual Itaú acima. Outros bancos divergem em vários campos —
 *   variações devem virar extensão desta estratégia.
 * - Datas no formato DDMMAA (6 dígitos, padrão do CNAB400).
 * - Valores em centavos, sem separadores (13 posições, 9(11)V9(2)).
 * - DAC da agência/conta (Anexo 3 do manual) e DAC do nosso número
 *   (Anexo 4: agência + conta + carteira + nosso número) calculados pelo
 *   motor por Módulo 10.
 * - Campos de juros/desconto/IOF/abatimento saem zerados na remessa para
 *   manter o formulário enxuto; o essencial de cobrança é parametrizável.
 * - Registros opcionais (multa, sacador/avalista tipo 5, cheques etc.)
 *   fora do escopo desta versão.
 */

import { modulo10 } from '../check-digits';
import { currentDateDDMMAA, padNum } from '../formatting';
import { computed, editable, fixed, inherited } from './field-helpers';
import type { ComputeContext, FileKind, FileStructure, LayoutStrategy, RecordSpec } from '../types';

const LINE_LENGTH = 400;

/** Sequencial do registro no arquivo (posições 395–400 de todo registro). */
function lineSequence(ctx: ComputeContext): string {
  return String(ctx.lineNumber);
}

/** Módulo 10 tolerante a valores fora do domínio (validação desligada). */
function safeModulo10(digits: string): string {
  return /^\d+$/.test(digits) ? String(modulo10(digits)) : '';
}

/** DAC da agência/conta da empresa (Anexo 3: Módulo 10 de agência + conta). */
function dacAgencyAccount(ctx: ComputeContext): string {
  const agency = (ctx.values.agency ?? '').trim();
  const account = (ctx.values.account ?? '').trim();
  if (!/^\d+$/.test(agency) || !/^\d+$/.test(account)) return '';
  return safeModulo10(padNum(agency, 4) + padNum(account, 5));
}

/** DAC do nosso número (Anexo 4: ag + conta + carteira + nosso número). */
function dacOurNumber(ctx: ComputeContext): string {
  const agency = (ctx.values.agency ?? '').trim();
  const account = (ctx.values.account ?? '').trim();
  const wallet = (ctx.values.walletNumber ?? '').trim();
  const ourNumber = (ctx.values.ourNumber ?? '').trim();
  if (![agency, account, wallet, ourNumber].every((part) => /^\d+$/.test(part))) return '';
  return safeModulo10(
    padNum(agency, 4) + padNum(account, 5) + padNum(wallet, 3) + padNum(ourNumber, 8),
  );
}

/** Ecoa o nosso número informado (a spec o repete em mais de uma posição). */
function echoOurNumber(ctx: ComputeContext): string {
  return (ctx.values.ourNumber ?? '').trim();
}

/** Header — registro tipo 0. */
function buildFileHeader(kind: FileKind): RecordSpec {
  const fields = [
    fixed('recordType', 'Tipo de Registro', 1, 1, 'num', '0'),
    fixed('fileCode', 'Código Remessa/Retorno', 2, 2, 'num', kind === 'remessa' ? '1' : '2'),
    fixed('fileLiteral', 'Literal', 3, 9, 'alfa', kind === 'remessa' ? 'REMESSA' : 'RETORNO'),
    fixed('serviceCode', 'Código do Serviço', 10, 11, 'num', '01'),
    fixed('serviceLiteral', 'Literal do Serviço', 12, 26, 'alfa', 'COBRANCA'),
    editable('agency', 'Agência', 27, 30, 'num', { required: true, hint: '4 dígitos' }),
    fixed('agencyFiller', 'Zeros', 31, 32, 'num', '00'),
    editable('account', 'Conta Corrente', 33, 37, 'num', { required: true, hint: '5 dígitos' }),
    // DAC da agência/conta calculado pelo motor (Anexo 3 do manual).
    computed('accountDigit', 'DAC da Agência/Conta', 38, 38, 'num', dacAgencyAccount),
    editable('companyName', 'Nome da Empresa', 47, 76, 'alfa', {
      required: true,
      hint: 'Até 30 caracteres',
    }),
    editable('bankCode', 'Código do Banco', 77, 79, 'num', {
      required: true,
      defaultValue: '341',
      hint: '3 dígitos (ex.: 341)',
    }),
    editable('bankName', 'Nome do Banco', 80, 94, 'alfa', { defaultValue: 'BANCO ITAU SA' }),
    computed('generationDate', 'Data de Geração', 95, 100, 'num', () => currentDateDDMMAA()),
    computed('sequence', 'Sequencial do Registro', 395, 400, 'num', lineSequence),
  ];
  if (kind === 'retorno') {
    // Campos exclusivos do header de retorno (informados pelo banco).
    fields.splice(
      fields.length - 1,
      0,
      editable('density', 'Densidade de Gravação', 101, 105, 'num', { defaultValue: '01600' }),
      fixed('densityUnit', 'Unidade da Densidade', 106, 108, 'alfa', 'BPI'),
      editable('returnSequence', 'Nº Sequencial do Arquivo Retorno', 109, 113, 'num', {
        defaultValue: '1',
      }),
      editable('creditDate', 'Data de Crédito dos Lançamentos', 114, 119, 'num', {
        hint: 'DDMMAA',
      }),
    );
  }
  return { id: 'fileHeader', label: 'Header de Arquivo', fields };
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
    computed('accountDigit', 'DAC da Agência/Conta', 29, 29, 'num', dacAgencyAccount),
    fixed('instructionCode', 'Instrução/Alegação Cancelada', 34, 37, 'num', '0'),
    editable('titleId', 'Identificação na Empresa', 38, 62, 'alfa', {
      hint: 'Uso livre da empresa ("seu número")',
    }),
    editable('ourNumber', 'Nosso Número', 63, 70, 'num', { required: true, hint: '8 dígitos' }),
    fixed('currencyQty', 'Quantidade de Moeda Variável', 71, 83, 'num', '0'),
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
    // A spec define a espécie da remessa como X(02) — alfanumérico.
    editable('titleKind', 'Espécie do Título', 148, 149, 'alfa', {
      defaultValue: '01',
      hint: '01 = duplicata mercantil',
    }),
    editable('acceptance', 'Aceite', 150, 150, 'alfa', {
      defaultValue: 'N',
      hint: 'A = aceite · N = não aceite',
    }),
    editable('issueDate', 'Data de Emissão', 151, 156, 'num', { hint: 'DDMMAA' }),
    editable('instruction1', 'Instrução 1', 157, 158, 'alfa', {
      defaultValue: '00',
      hint: 'Código de instrução de cobrança (Nota 11)',
    }),
    editable('instruction2', 'Instrução 2', 159, 160, 'alfa', { defaultValue: '00' }),
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
    editable('guarantorName', 'Sacador/Avalista', 352, 381, 'alfa', {
      hint: 'Até 30 caracteres',
    }),
    editable('moraDate', 'Data de Mora', 386, 391, 'num', { hint: 'DDMMAA' }),
    editable('deadline', 'Prazo (dias)', 392, 393, 'num', {
      defaultValue: '00',
      hint: 'Dias para a instrução de protesto/negativação',
    }),
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
    computed('accountDigit', 'DAC da Agência/Conta', 29, 29, 'num', dacAgencyAccount),
    editable('titleId', 'Identificação na Empresa', 38, 62, 'alfa', {
      hint: 'Uso livre da empresa ("seu número")',
    }),
    editable('ourNumber', 'Nosso Número', 63, 70, 'num', { required: true, hint: '8 dígitos' }),
    editable('walletNumber', 'Número da Carteira', 83, 85, 'num', { defaultValue: '109' }),
    // A spec repete o nosso número (86–93) e traz o DAC dele (94, Anexo 4).
    computed('ourNumberRepeat', 'Nosso Número (repetição)', 86, 93, 'num', echoOurNumber),
    computed('ourNumberDigit', 'DAC do Nosso Número', 94, 94, 'num', dacOurNumber),
    fixed('walletCode', 'Código da Carteira', 108, 108, 'alfa', 'I'),
    editable('occurrenceCode', 'Código de Ocorrência', 109, 110, 'num', {
      required: true,
      defaultValue: '06',
      hint: '06 = liquidação normal (Nota 17)',
    }),
    editable('occurrenceDate', 'Data da Ocorrência', 111, 116, 'num', {
      required: true,
      hint: 'DDMMAA · data do pagamento',
    }),
    editable('documentNumber', 'Número do Documento', 117, 126, 'alfa'),
    computed('ourNumberConfirmation', 'Nosso Número (confirmação)', 127, 134, 'num', echoOurNumber),
    editable('dueDate', 'Data de Vencimento', 147, 152, 'num', { hint: 'DDMMAA' }),
    editable('titleAmount', 'Valor do Título', 153, 165, 'num', {
      required: true,
      hint: 'Em centavos',
    }),
    editable('collectingBank', 'Banco Cobrador', 166, 168, 'num', { defaultValue: '341' }),
    editable('collectingAgency', 'Agência Cobradora', 169, 172, 'num', { defaultValue: '0' }),
    fixed('collectingAgencyDigit', 'DAC da Agência Cobradora', 173, 173, 'num', '0'),
    editable('titleKind', 'Espécie do Título', 174, 175, 'num', {
      defaultValue: '01',
      hint: 'Nota 10 (01 = duplicata mercantil)',
    }),
    // Correção do bug herdado do protótipo (RF-11): Valor da Tarifa explícito.
    editable('feeAmount', 'Valor da Tarifa', 176, 188, 'num', {
      hint: 'Em centavos · tarifa de cobrança',
    }),
    // Posições 189–214: brancos (complemento do registro, spec Itaú).
    fixed('iofAmount', 'Valor do IOF', 215, 227, 'num', '0'),
    fixed('abatementAmount', 'Valor do Abatimento', 228, 240, 'num', '0'),
    fixed('discountAmount', 'Descontos Concedidos', 241, 253, 'num', '0'),
    // Correção do bug herdado do protótipo (RF-11): Valor Recebido explícito.
    editable('receivedAmount', 'Valor Recebido (Principal)', 254, 266, 'num', {
      required: true,
      hint: 'Em centavos · valor lançado em conta corrente',
    }),
    editable('interestAmount', 'Juros de Mora/Multa', 267, 279, 'num', {
      defaultValue: '0',
      hint: 'Em centavos',
    }),
    fixed('otherCredits', 'Outros Créditos', 280, 292, 'num', '0'),
    // A spec define a data de crédito do retorno como X(06) — alfanumérico.
    editable('creditDate', 'Data do Crédito', 296, 301, 'alfa', { hint: 'DDMMAA' }),
    fixed('cancelledInstruction', 'Instrução Cancelada', 302, 305, 'num', '0'),
    fixed('zeros', 'Zeros', 312, 324, 'num', '0'),
    editable('payerName', 'Nome do Pagador', 325, 354, 'alfa', { hint: 'Até 30 caracteres' }),
    editable('errorMessage', 'Erros / Mensagem Informativa', 378, 385, 'alfa', {
      hint: 'Até 4 códigos de 2 posições (Nota 20)',
    }),
    editable('liquidationCode', 'Código de Liquidação', 393, 394, 'alfa', {
      hint: 'Meio de liquidação do título (Nota 28)',
    }),
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
      // Só a cobrança Simples é suportada — Vinculada e Direta saem zeradas.
      computed('titleCount', 'Qtde de Títulos — Cobrança Simples', 18, 25, 'num', (ctx) =>
        String(ctx.detailCount),
      ),
      computed('titleTotal', 'Valor Total — Cobrança Simples', 26, 39, 'num', (ctx) =>
        ctx.sumOfDetailField('titleAmount').toString(),
      ),
      fixed('linkedTitleCount', 'Qtde — Cobrança Vinculada', 58, 65, 'num', '0'),
      fixed('linkedTitleTotal', 'Valor Total — Cobrança Vinculada', 66, 79, 'num', '0'),
      fixed('directTitleCount', 'Qtde — Cobrança Direta/Escritural', 178, 185, 'num', '0'),
      fixed('directTitleTotal', 'Valor Total — Cobrança Direta/Escritural', 186, 199, 'num', '0'),
      inherited('returnSequence', 'Nº Sequencial do Arquivo Retorno', 208, 212, 'num'),
      computed('detailRecordCount', 'Quantidade de Detalhes', 213, 220, 'num', (ctx) =>
        String(ctx.detailCount),
      ),
      computed('informedTotal', 'Valor Total Informado', 221, 234, 'num', (ctx) =>
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
  description: 'Cobrança Itaú 400 posições — header, detalhes (tipo 1) e trailer',
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
