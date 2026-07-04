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

describe('RCB001 — paridade com o protótipo (RF-11)', () => {
  const strategy = getLayoutStrategy('RCB001');

  const input: FileInput = {
    kind: 'retorno',
    headerValues: {
      bankCode: '341',
      agency: '1234',
      account: '12345678',
      companyName: 'EMPRESA TESTE LTDA',
    },
    batchValues: {},
    details: [
      {
        id: 'd1',
        values: {
          ourNumber: '123456789012',
          occurrenceDate: '15062026',
          titleAmount: '150000',
          receivedAmount: '150000',
          feeAmount: '1050',
        },
      },
    ],
  };

  it('só suporta retorno, com extensão .ret', () => {
    expect(strategy.kinds).toEqual(['retorno']);
    expect(strategy.fileExtension('retorno')).toBe('.ret');
  });

  it('posiciona Valor Recebido nas posições 54–65 (12 dígitos)', () => {
    const result = generateFile(strategy, input);
    const detailLine = result.lines[1]!;
    expect(detailLine.slice(53, 65)).toBe('000000150000');
  });

  it('posiciona Valor da Tarifa nas posições 66–75 (10 dígitos)', () => {
    const result = generateFile(strategy, input);
    const detailLine = result.lines[1]!;
    expect(detailLine.slice(65, 75)).toBe('0000001050');
  });

  it('totaliza valores recebidos no trailer', () => {
    const result = generateFile(strategy, input);
    const trailer = result.lines.at(-1)!;
    expect(trailer[0]).toBe('9');
    // Quantidade (8–13) e total recebido (14–27)
    expect(trailer.slice(7, 13)).toBe('000001');
    expect(trailer.slice(13, 27)).toBe('00000000150000');
  });

  it('numera os sequenciais de todas as linhas (145–150)', () => {
    const result = generateFile(strategy, input);
    result.lines.forEach((line, index) => {
      expect(line.slice(144, 150)).toBe(String(index + 1).padStart(6, '0'));
    });
  });

  it('rejeita tarifa com letras com mensagem útil em PT-BR', () => {
    const broken: FileInput = {
      ...input,
      details: [{ id: 'd1', values: { ...input.details[0]!.values, feeAmount: '00ABC8' } }],
    };
    const result = generateFile(strategy, broken);
    expect(result.errors.some((error) => error.message.includes('Valor da Tarifa'))).toBe(true);
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

  function fillCnab240(target: LayoutStrategy, kind: FileKind): FileInput {
    return fillAllEditable(target, kind);
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
          },
        },
      ],
    };
  }
});

describe('CNAB400 — estrutura e campos críticos', () => {
  const strategy = getLayoutStrategy('CNAB400');

  const retornoInput: FileInput = {
    kind: 'retorno',
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
          occurrenceCode: '06',
          occurrenceDate: '150626',
          titleAmount: '150000',
          receivedAmount: '150000',
          feeAmount: '1050',
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
