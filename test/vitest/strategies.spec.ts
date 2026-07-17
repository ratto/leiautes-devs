/**
 * Testes das estratégias reais (RCB001, CNAB240, CNAB400): sanidade
 * estrutural das especificações, largura das linhas, posições dos campos
 * críticos (Valor Recebido e Valor da Tarifa — RF-11), sequenciais e totais.
 */

import { describe, expect, it } from 'vitest';
import {
  assertRecordSpecIsSound,
  generateFile,
  getLayoutStrategy,
  layoutStrategies,
  modulo10,
} from '@/core/leiautes';
import type { FileInput, FileKind, LayoutStrategy } from '@/core/leiautes';

/** Valor plausível que respeita o tamanho e o tipo do campo. */
function sampleValue(field: { type: string; start: number; end: number }): string {
  const length = field.end - field.start + 1;
  return field.type === 'num' ? '9'.repeat(Math.min(length, 5)) : 'TESTE'.slice(0, length);
}

/** Preenche todos os campos editáveis com valores plausíveis. */
function fillAllEditable(strategy: LayoutStrategy, kind: FileKind): FileInput {
  const structure = strategy.structure(kind);
  const values = (recordIds: ('fileHeader' | 'batchHeader')[]) => {
    const result: Record<string, string> = {};
    for (const id of recordIds) {
      const record = structure[id];
      if (!record) continue;
      for (const field of record.fields) {
        if (field.editable) {
          result[field.key] = field.defaultValue ?? sampleValue(field);
        }
      }
    }
    return result;
  };
  const detailValues: Record<string, string> = {};
  for (const segment of structure.detailSegments) {
    for (const field of segment.fields) {
      if (field.editable) {
        detailValues[field.key] = field.defaultValue ?? sampleValue(field);
      }
    }
  }
  return {
    kind,
    headerValues: values(['fileHeader']),
    batchValues: values(['batchHeader']),
    details: [
      { id: 'd1', values: { ...detailValues } },
      { id: 'd2', values: { ...detailValues } },
    ],
  };
}

/** Todos os pares estratégia × tipo suportado. */
const allCases = layoutStrategies.flatMap((strategy) =>
  strategy.kinds.map((kind) => ({ strategy, kind })),
);

describe.each(allCases)('$strategy.id ($kind)', ({ strategy, kind }) => {
  const structure = strategy.structure(kind);

  it('tem especificações estruturalmente sãs (sem sobreposição/estouro)', () => {
    const records = [
      structure.fileHeader,
      structure.batchHeader,
      ...structure.detailSegments,
      structure.batchTrailer,
      structure.fileTrailer,
    ].filter((record) => record !== undefined);
    for (const record of records) {
      expect(() => assertRecordSpecIsSound(record, strategy.lineLength)).not.toThrow();
    }
  });

  it('gera todas as linhas na largura exata do leiaute', () => {
    const result = generateFile(strategy, fillAllEditable(strategy, kind));
    expect(result.lines.length).toBeGreaterThanOrEqual(4);
    for (const line of result.lines) {
      expect(line).toHaveLength(strategy.lineLength);
    }
  });

  it('gera arquivo sem erros quando tudo está preenchido', () => {
    const result = generateFile(strategy, fillAllEditable(strategy, kind));
    expect(result.errors).toEqual([]);
  });

  it('acusa erros quando campos obrigatórios faltam', () => {
    const input = fillAllEditable(strategy, kind);
    const result = generateFile(strategy, { ...input, headerValues: {}, details: [] });
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('RCB001 — conformidade com o manual do BB (registros A/G/Z)', () => {
  const strategy = getLayoutStrategy('RCB001');

  const input: FileInput = {
    kind: 'retorno',
    headerValues: {
      agreementNumber: '123456',
      ediSequence: '1',
      companyName: 'LOJA VIRTUAL TESTE',
      bankCode: '001',
      bankName: 'BANCO DO BRASIL',
      fileSequence: '1',
    },
    batchValues: {},
    details: [
      {
        id: 'd1',
        values: {
          agency: '1234',
          account: '123456789',
          paymentDate: '20260615',
          creditDate: '20260616',
          orderNumber: '987654321',
          receivedAmount: '150000',
          feeAmount: '1050',
          receivingAgency: '5678',
          collectionMethod: '3',
          electronicAuth: 'AUTH123',
          paymentMethod: '1',
        },
      },
    ],
  };

  it('só suporta retorno, com extensão .ret', () => {
    expect(strategy.kinds).toEqual(['retorno']);
    expect(strategy.fileExtension('retorno')).toBe('.ret');
  });

  it('gera o header código A com convênio, EDI, NSA e versão 02 nas posições da spec', () => {
    const header = generateFile(strategy, input).lines[0]!;
    expect(header[0]).toBe('A'); // código do registro
    expect(header[1]).toBe('2'); // código de remessa (retorno)
    expect(header.slice(2, 8)).toBe('123456'); // convênio (003–008)
    expect(header.slice(9, 18)).toBe('000000001'); // sequencial EDI (010–018)
    expect(header.slice(22, 42)).toBe('LOJA VIRTUAL TESTE  '); // empresa (023–042)
    expect(header.slice(42, 45)).toBe('001'); // banco (043–045)
    expect(header.slice(45, 65)).toBe('BANCO DO BRASIL     '); // nome banco (046–065)
    expect(header.slice(65, 73)).toMatch(/^20\d{6}$/); // geração AAAAMMDD (066–073)
    expect(header.slice(73, 79)).toBe('000001'); // NSA (074–079)
    expect(header.slice(79, 81)).toBe('02'); // versão do leiaute (080–081)
    expect(header.slice(81)).toBe(' '.repeat(69)); // 082–150: reservado/vazio
  });

  it('gera o detalhe código G com DVs Módulo 11 do BB para agência e conta', () => {
    const detail = generateFile(strategy, input).lines[1]!;
    expect(detail[0]).toBe('G');
    expect(detail.slice(1, 5)).toBe('1234'); // agência (002–005)
    // 1234 → pesos 2..5 → soma 30 → resto 8 → DV 3
    expect(detail[5]).toBe('3');
    expect(detail.slice(6, 15)).toBe('123456789'); // conta (007–015)
    // 123456789 → pesos 2..10 → soma 210 → resto 1 → DV 10 → 'X'
    expect(detail[15]).toBe('X');
    expect(detail.slice(21, 29)).toBe('20260615'); // data do pagamento (022–029)
    expect(detail.slice(29, 37)).toBe('20260616'); // data do crédito (030–037)
  });

  it('monta o código de barras (038–081) com os subcampos G5.1–G5.9 e DV Módulo 10', () => {
    const detail = generateFile(strategy, input).lines[1]!;
    const value = '00000150000'; // G5.5: valor recebido em 11 posições
    const order = '00000000987654321'; // G5.9: refTran em 17 posições
    const dv = String(modulo10(`896${value}000101123456${order}`));
    expect(detail.slice(37, 81)).toBe(`896${dv}${value}000101123456${order}`);
  });

  it('posiciona Valor Recebido (082–093), Tarifa (094–100) e demais campos G', () => {
    const detail = generateFile(strategy, input).lines[1]!;
    expect(detail.slice(81, 93)).toBe('000000150000'); // G6: 12 dígitos
    expect(detail.slice(93, 100)).toBe('0001050'); // G7: 7 dígitos
    expect(detail.slice(100, 108)).toBe('00000002'); // G8: sequencial de registro
    expect(detail.slice(108, 112)).toBe('5678'); // G9.1: agência recebedora
    expect(detail[116]).toBe('3'); // G10: meio de arrecadação (Internet)
    expect(detail.slice(117, 140)).toBe('AUTH123'.padEnd(23, ' ')); // G11
    expect(detail[140]).toBe('1'); // G12: forma de recebimento
    expect(detail.slice(141)).toBe(' '.repeat(9)); // G13: uso futuro
  });

  it('gera o trailer código Z com total de registros (inclusive header/trailer)', () => {
    const trailer = generateFile(strategy, input).lines.at(-1)!;
    expect(trailer[0]).toBe('Z');
    expect(trailer.slice(1, 7)).toBe('000003'); // Z2: header + 1 detalhe + trailer
    expect(trailer.slice(7, 24)).toBe('00000000000150000'); // Z3: 17 dígitos
    expect(trailer.slice(24)).toBe(' '.repeat(126)); // Z4: livre
  });

  it('rejeita tarifa com letras com mensagem útil em PT-BR', () => {
    const broken: FileInput = {
      ...input,
      details: [{ id: 'd1', values: { ...input.details[0]!.values, feeAmount: '00ABC8' } }],
    };
    const result = generateFile(strategy, broken);
    expect(result.errors.some((error) => error.message.includes('Valor da Tarifa'))).toBe(true);
  });

  it('não quebra o DV quando a agência é inválida (validação desligada)', () => {
    const broken: FileInput = {
      ...input,
      details: [{ id: 'd1', values: { ...input.details[0]!.values, agency: 'ABCD' } }],
    };
    const detail = generateFile(strategy, broken).lines[1]!;
    expect(detail[5]).toBe(' '); // DV vazio vira espaço, sem lançar erro
  });
});

describe('CNAB240 — estrutura de lote e segmentos', () => {
  const strategy = getLayoutStrategy('CNAB240');

  it('remessa gera segmentos P e Q; retorno gera T e U', () => {
    expect(strategy.structure('remessa').detailSegments.map((s) => s.id)).toEqual([
      'segmentP',
      'segmentQ',
    ]);
    expect(strategy.structure('retorno').detailSegments.map((s) => s.id)).toEqual([
      'segmentT',
      'segmentU',
    ]);
  });

  it('gera a hierarquia header arquivo → header lote → detalhes → trailers', () => {
    const input = buildCnab240RetornoInput();
    const result = generateFile(strategy, input);
    // 8º caractere identifica o tipo de registro no CNAB240.
    expect(result.lines.map((line) => line[7])).toEqual(['0', '1', '3', '3', '5', '9']);
    // Código do segmento na posição 14 das linhas de detalhe.
    expect(result.lines[2]![13]).toBe('T');
    expect(result.lines[3]![13]).toBe('U');
  });

  it('marca remessa/retorno na posição 143 do header', () => {
    const remessa = generateFile(strategy, fillCnab240(strategy, 'remessa'));
    const retorno = generateFile(strategy, buildCnab240RetornoInput());
    expect(remessa.lines[0]![142]).toBe('1');
    expect(retorno.lines[0]![142]).toBe('2');
  });

  it('posiciona Valor Recebido (78–92 do U) e Tarifa (199–213 do T)', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const segmentT = result.lines[2]!;
    const segmentU = result.lines[3]!;
    expect(segmentT.slice(198, 213)).toBe('000000000001050');
    expect(segmentU.slice(77, 92)).toBe('000000000150000');
  });

  it('calcula o valor líquido (recebido − tarifa) automaticamente', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const segmentU = result.lines[3]!;
    // 150000 − 1050 = 148950
    expect(segmentU.slice(92, 107)).toBe('000000000148950');
  });

  it('totaliza registros e títulos nos trailers (RF-07)', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const batchTrailer = result.lines[4]!;
    const fileTrailer = result.lines[5]!;
    // Lote: header + 2 segmentos + trailer = 4 registros; 1 título.
    expect(batchTrailer.slice(17, 23)).toBe('000004');
    expect(batchTrailer.slice(23, 29)).toBe('000001');
    // Arquivo: 6 linhas no total.
    expect(fileTrailer.slice(23, 29)).toBe('000006');
  });

  it('grava o Motivo da Ocorrência no Segmento T (214–223) e zera o contrato', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const segmentT = result.lines[2]!;
    expect(segmentT.slice(188, 198)).toBe('0000000000'); // contrato (189–198)
    expect(segmentT.slice(213, 223)).toBe('A4        '); // motivo (214–223)
  });

  it('grava o bloco Ocorrência do Pagador no Segmento U (154–233)', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const segmentU = result.lines[3]!;
    expect(segmentU.slice(153, 157)).toBe('0101'); // código (154–157)
    expect(segmentU.slice(157, 165)).toBe('15062026'); // data (158–165)
    expect(segmentU.slice(165, 180)).toBe('000000000005000'); // valor (166–180)
    expect(segmentU.slice(180, 210)).toBe('PAGAMENTO PARCIAL'.padEnd(30, ' ')); // complemento
    // Banco correspondente fora do escopo → campos Num zerados (211–233).
    expect(segmentU.slice(210, 213)).toBe('000');
    expect(segmentU.slice(213, 233)).toBe('0'.repeat(20));
  });

  it('preenche os DVs do Segmento T como numéricos (zeros quando vazios)', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const segmentT = result.lines[2]!;
    // DV agência (023), DV conta (036) e DV ag/conta (037): Num neste registro.
    expect(segmentT[22]).toBe('0');
    expect(segmentT[35]).toBe('0');
    expect(segmentT[36]).toBe('0');
  });

  it('zera os totais de carteiras não suportadas no Trailer de Lote (047–115)', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    const batchTrailer = result.lines[4]!;
    // Vinculada, Caucionada e Descontada saem zeradas; sem campo inventado.
    expect(batchTrailer.slice(46, 115)).toBe('0'.repeat(69));
    expect(batchTrailer.slice(115, 123)).toBe(' '.repeat(8)); // aviso de lançamento
  });

  it('zera a Qtde de Contas p/ Conciliação no Trailer de Arquivo (030–035)', () => {
    const result = generateFile(strategy, buildCnab240RetornoInput());
    expect(result.lines[5]!.slice(29, 35)).toBe('000000');
  });

  it('grava a Data do Crédito do Header de Lote (200–207) com zeros por padrão', () => {
    const retorno = generateFile(strategy, buildCnab240RetornoInput());
    const remessa = generateFile(strategy, buildCnab240RemessaInput());
    expect(retorno.lines[1]!.slice(199, 207)).toBe('00000000');
    expect(remessa.lines[1]!.slice(199, 207)).toBe('00000000');
  });

  it('grava emissão/distribuição do boleto e agência cobradora no Segmento P', () => {
    const result = generateFile(strategy, buildCnab240RemessaInput());
    const segmentP = result.lines[2]!;
    expect(segmentP[60]).toBe('2'); // emissão do boleto (061)
    expect(segmentP[61]).toBe('2'); // distribuição do boleto (062)
    expect(segmentP.slice(100, 105)).toBe('00000'); // agência cobradora (101–105)
    expect(segmentP[108]).toBe('N'); // aceite (109)
    // Prazo de baixa é Alfa na spec: '0' alinhado à esquerda (225–227).
    expect(segmentP.slice(224, 227)).toBe('0  ');
    expect(segmentP.slice(229, 239)).toBe('0000000000'); // contrato (230–239)
  });

  it('separa CEP e sufixo no Segmento Q e zera o banco correspondente', () => {
    const result = generateFile(strategy, buildCnab240RemessaInput());
    const segmentQ = result.lines[3]!;
    expect(segmentQ.slice(128, 133)).toBe('01310'); // CEP (129–133)
    expect(segmentQ.slice(133, 136)).toBe('100'); // sufixo (134–136)
    expect(segmentQ.slice(209, 212)).toBe('000'); // banco correspondente (210–212)
  });

  function fillCnab240(target: LayoutStrategy, kind: FileKind): FileInput {
    return fillAllEditable(target, kind);
  }

  function buildCnab240RemessaInput(): FileInput {
    return {
      kind: 'remessa',
      headerValues: {
        bankCode: '341',
        companyDocument: '12345678000199',
        agency: '1234',
        account: '123456',
        companyName: 'EMPRESA TESTE LTDA',
      },
      batchValues: {},
      details: [
        {
          id: 'd1',
          values: {
            ourNumber: '12345678901234567890',
            dueDate: '15072026',
            titleAmount: '150000',
            payerDocument: '12345678901',
            payerName: 'FULANO DE TAL',
            payerZip: '01310',
            payerZipSuffix: '100',
          },
        },
      ],
    };
  }

  function buildCnab240RetornoInput(): FileInput {
    return {
      kind: 'retorno',
      headerValues: {
        bankCode: '341',
        companyDocument: '12345678000199',
        agency: '1234',
        account: '123456',
        companyName: 'EMPRESA TESTE LTDA',
      },
      batchValues: {},
      details: [
        {
          id: 'd1',
          values: {
            ourNumber: '12345678901234567890',
            titleAmount: '150000',
            receivedAmount: '150000',
            feeAmount: '1050',
            occurrenceDate: '15062026',
            occurrenceReason: 'A4',
            payerOccurrenceCode: '0101',
            payerOccurrenceDate: '15062026',
            payerOccurrenceValue: '5000',
            payerOccurrenceDetail: 'PAGAMENTO PARCIAL',
          },
        },
      ],
    };
  }
});

describe('CNAB400 — conformidade com o manual Itaú (jan/2017)', () => {
  const strategy = getLayoutStrategy('CNAB400');

  const retornoInput: FileInput = {
    kind: 'retorno',
    headerValues: {
      agency: '1234',
      account: '12345',
      companyName: 'EMPRESA TESTE LTDA',
      bankCode: '341',
      // A store semeia os defaults dos campos editáveis — espelhado aqui.
      returnSequence: '1',
    },
    batchValues: {},
    details: [
      {
        id: 'd1',
        values: {
          companyDocument: '12345678000199',
          ourNumber: '12345678',
          walletNumber: '109',
          occurrenceCode: '06',
          occurrenceDate: '150626',
          titleAmount: '150000',
          receivedAmount: '150000',
          feeAmount: '1050',
          creditDate: '150626',
          payerName: 'FULANO DE TAL',
        },
      },
    ],
  };

  const remessaInput: FileInput = {
    kind: 'remessa',
    headerValues: {
      agency: '1234',
      account: '12345',
      companyName: 'EMPRESA TESTE LTDA',
      bankCode: '341',
    },
    batchValues: {},
    details: [
      {
        id: 'd1',
        values: {
          companyDocument: '12345678000199',
          ourNumber: '12345678',
          dueDate: '150726',
          titleAmount: '150000',
          payerDocument: '12345678901',
          payerName: 'FULANO DE TAL',
          guarantorName: 'AVALISTA TESTE',
        },
      },
    ],
  };

  it('identifica os registros pelo primeiro caractere (0/1/9)', () => {
    const result = generateFile(strategy, retornoInput);
    expect(result.lines.map((line) => line[0])).toEqual(['0', '1', '9']);
  });

  it('grava o literal RETORNO/REMESSA no header', () => {
    const retorno = generateFile(strategy, retornoInput);
    expect(retorno.lines[0]!.slice(2, 9)).toBe('RETORNO');
    const remessa = generateFile(strategy, fillAllEditable(strategy, 'remessa'));
    expect(remessa.lines[0]!.slice(2, 9)).toBe('REMESSA');
  });

  it('posiciona Valor Recebido (254–266) e Tarifa (176–188) no retorno', () => {
    const result = generateFile(strategy, retornoInput);
    const detail = result.lines[1]!;
    expect(detail.slice(253, 266)).toBe('0000000150000');
    expect(detail.slice(175, 188)).toBe('0000000001050');
  });

  it('numera os sequenciais nas posições 395–400', () => {
    const result = generateFile(strategy, retornoInput);
    result.lines.forEach((line, index) => {
      expect(line.slice(394, 400)).toBe(String(index + 1).padStart(6, '0'));
    });
  });

  it('totaliza títulos no trailer de retorno', () => {
    const result = generateFile(strategy, retornoInput);
    const trailer = result.lines.at(-1)!;
    expect(trailer.slice(17, 25)).toBe('00000001');
    expect(trailer.slice(25, 39)).toBe('00000000150000');
  });

  it('calcula o DAC da agência/conta (Anexo 3) no header e nos detalhes', () => {
    const result = generateFile(strategy, retornoInput);
    const dac = String(modulo10('123412345')); // agência 1234 + conta 12345
    expect(result.lines[0]![37]).toBe(dac); // header, posição 38
    expect(result.lines[1]![28]).toBe(dac); // detalhe, posição 29
  });

  it('repete o nosso número (086–093 e 127–134) com DAC do Anexo 4 (094)', () => {
    const detail = generateFile(strategy, retornoInput).lines[1]!;
    expect(detail.slice(85, 93)).toBe('12345678');
    expect(detail.slice(126, 134)).toBe('12345678');
    // DAC: agência + conta + carteira (109, default) + nosso número.
    expect(detail[93]).toBe(String(modulo10('12341234510912345678')));
  });

  it('mantém brancos nas posições 189–214 e zera IOF/abatimento/descontos', () => {
    const detail = generateFile(strategy, retornoInput).lines[1]!;
    expect(detail.slice(188, 214)).toBe(' '.repeat(26)); // complemento (brancos)
    expect(detail.slice(214, 227)).toBe('0'.repeat(13)); // IOF (215–227)
    expect(detail.slice(227, 240)).toBe('0'.repeat(13)); // abatimento (228–240)
    expect(detail.slice(240, 253)).toBe('0'.repeat(13)); // descontos (241–253)
    expect(detail.slice(279, 292)).toBe('0'.repeat(13)); // outros créditos (280–292)
  });

  it('grava espécie, data de crédito e nome do pagador do retorno', () => {
    const detail = generateFile(strategy, retornoInput).lines[1]!;
    expect(detail.slice(173, 175)).toBe('01'); // espécie (174–175)
    expect(detail.slice(295, 301)).toBe('150626'); // data de crédito (296–301)
    expect(detail.slice(324, 354)).toBe('FULANO DE TAL'.padEnd(30, ' ')); // pagador
  });

  it('totaliza o trailer de retorno completo (NSA, detalhes e valor informado)', () => {
    const trailer = generateFile(strategy, retornoInput).lines.at(-1)!;
    expect(trailer.slice(57, 65)).toBe('0'.repeat(8)); // vinculada: qtde
    expect(trailer.slice(65, 79)).toBe('0'.repeat(14)); // vinculada: valor
    expect(trailer.slice(177, 185)).toBe('0'.repeat(8)); // direta/escritural: qtde
    expect(trailer.slice(185, 199)).toBe('0'.repeat(14)); // direta/escritural: valor
    expect(trailer.slice(207, 212)).toBe('00001'); // NSA do retorno (208–212)
    expect(trailer.slice(212, 220)).toBe('00000001'); // qtde de detalhes (213–220)
    expect(trailer.slice(220, 234)).toBe('00000000150000'); // valor informado
  });

  it('preenche o header de retorno com densidade, BPI, NSA e data de crédito', () => {
    const header = generateFile(strategy, retornoInput).lines[0]!;
    expect(header.slice(100, 105)).toBe('01600'); // densidade (101–105)
    expect(header.slice(105, 108)).toBe('BPI'); // unidade (106–108)
    expect(header.slice(108, 113)).toBe('00001'); // NSA do retorno (109–113)
    expect(header.slice(113, 119)).toBe('000000'); // data de crédito vazia (114–119)
  });

  it('zera instrução/quantidade de moeda e grava instruções e avalista na remessa', () => {
    const detail = generateFile(strategy, remessaInput).lines[1]!;
    expect(detail.slice(33, 37)).toBe('0000'); // instrução/alegação (034–037)
    expect(detail.slice(70, 83)).toBe('0'.repeat(13)); // qtde de moeda (071–083)
    expect(detail.slice(156, 158)).toBe('00'); // instrução 1 (157–158)
    expect(detail.slice(158, 160)).toBe('00'); // instrução 2 (159–160)
    expect(detail.slice(351, 381)).toBe('AVALISTA TESTE'.padEnd(30, ' ')); // avalista
    expect(detail.slice(385, 391)).toBe('000000'); // data de mora (386–391)
    expect(detail.slice(391, 393)).toBe('00'); // prazo (392–393)
  });
});

describe('registry', () => {
  it('expõe os três leiautes do lançamento na ordem da UI', () => {
    expect(layoutStrategies.map((strategy) => strategy.id)).toEqual([
      'RCB001',
      'CNAB240',
      'CNAB400',
    ]);
  });

  it('lança erro claro para leiaute não registrado', () => {
    expect(() => getLayoutStrategy('CNAB444' as never)).toThrow('Leiaute não registrado');
  });
});
