/**
 * Testes do gerador genérico usando uma estratégia mínima de laboratório —
 * as estratégias reais são cobertas em `strategies.spec.ts`.
 */

import { describe, expect, it } from 'vitest';
import { assertRecordSpecIsSound, buildRuler, generateFile } from '@/core/leiautes/generator';
import type { FileInput, LayoutStrategy, RecordSpec } from '@/core/leiautes/types';

/** Estratégia mínima: 20 posições, header + detalhe + trailer com total. */
const miniStrategy: LayoutStrategy = {
  id: 'RCB001', // qualquer id serve para o laboratório
  label: 'Mini',
  description: 'Leiaute de laboratório',
  lineLength: 20,
  kinds: ['retorno'],
  fileExtension: () => '.txt',
  structure: () => ({
    fileHeader: {
      id: 'fileHeader',
      label: 'Header',
      fields: [
        { key: 'recordType', label: 'Tipo', start: 1, end: 1, type: 'num', defaultValue: '0' },
        {
          key: 'companyName',
          label: 'Empresa',
          start: 2,
          end: 11,
          type: 'alfa',
          editable: true,
          required: true,
        },
        // Lacuna proposital nas posições 12–14 (deve virar espaços).
        {
          key: 'sequence',
          label: 'Sequencial',
          start: 15,
          end: 20,
          type: 'num',
          computed: (ctx) => String(ctx.lineNumber),
        },
      ],
    },
    detailSegments: [
      {
        id: 'detail',
        label: 'Detalhe',
        fields: [
          { key: 'recordType', label: 'Tipo', start: 1, end: 1, type: 'num', defaultValue: '1' },
          {
            key: 'amount',
            label: 'Valor',
            start: 2,
            end: 11,
            type: 'num',
            editable: true,
            required: true,
          },
          {
            key: 'sequence',
            label: 'Sequencial',
            start: 15,
            end: 20,
            type: 'num',
            computed: (ctx) => String(ctx.lineNumber),
          },
        ],
      },
    ],
    fileTrailer: {
      id: 'fileTrailer',
      label: 'Trailer',
      fields: [
        { key: 'recordType', label: 'Tipo', start: 1, end: 1, type: 'num', defaultValue: '9' },
        {
          key: 'total',
          label: 'Total',
          start: 2,
          end: 11,
          type: 'num',
          computed: (ctx) => ctx.sumOfDetailField('amount').toString(),
        },
        {
          key: 'count',
          label: 'Quantidade',
          start: 12,
          end: 14,
          type: 'num',
          computed: (ctx) => String(ctx.detailCount),
        },
        {
          key: 'sequence',
          label: 'Sequencial',
          start: 15,
          end: 20,
          type: 'num',
          computed: (ctx) => String(ctx.lineNumber),
        },
      ],
    },
  }),
};

function makeInput(overrides: Partial<FileInput> = {}): FileInput {
  return {
    kind: 'retorno',
    headerValues: { companyName: 'ACME' },
    batchValues: {},
    details: [
      { id: 'd1', values: { amount: '100' } },
      { id: 'd2', values: { amount: '250' } },
    ],
    ...overrides,
  };
}

describe('generateFile', () => {
  it('gera todas as linhas na largura fixa do leiaute', () => {
    const result = generateFile(miniStrategy, makeInput());
    expect(result.lines).toHaveLength(4);
    for (const line of result.lines) {
      expect(line).toHaveLength(20);
    }
  });

  it('formata campos, lacunas e sequenciais corretamente', () => {
    const result = generateFile(miniStrategy, makeInput());
    expect(result.lines[0]).toBe('0ACME         000001');
    expect(result.lines[1]).toBe('10000000100   000002');
    expect(result.lines[2]).toBe('10000000250   000003');
  });

  it('calcula totais e quantidades no trailer (RF-07)', () => {
    const result = generateFile(miniStrategy, makeInput());
    // Total: 100 + 250 = 350 · quantidade: 2 · sequencial: 4
    expect(result.lines[3]).toBe('90000000350002000004');
  });

  it('une as linhas com CRLF, com quebra final', () => {
    const result = generateFile(miniStrategy, makeInput());
    expect(result.content).toBe(result.lines.join('\r\n') + '\r\n');
  });

  it('monta o mapa de posições dos campos para o destaque (RF-14)', () => {
    const result = generateFile(miniStrategy, makeInput());
    const amount = result.fieldMap.find(
      (item) => item.fieldKey === 'amount' && item.detailId === 'd1',
    );
    expect(amount).toMatchObject({ lineIndex: 1, start: 2, end: 11 });
  });

  it('não trunca valor maior que o campo (erro proposital, RF-10)', () => {
    const result = generateFile(
      miniStrategy,
      makeInput({ details: [{ id: 'd1', values: { amount: '123456789012345' } }] }),
    );
    // A linha estoura a largura de propósito — arquivo malformado desejado.
    expect(result.lines[1]).toContain('123456789012345');
    expect(result.lines[1]!.length).toBeGreaterThan(20);
    // E o mapa de posições acompanha o deslocamento dos campos seguintes.
    const seq = result.fieldMap.find(
      (item) => item.fieldKey === 'sequence' && item.lineIndex === 1,
    );
    expect(seq?.start).toBeGreaterThan(15);
  });

  it('coleta erros de validação do arquivo inteiro', () => {
    const result = generateFile(
      miniStrategy,
      makeInput({
        headerValues: { companyName: '' },
        details: [{ id: 'd1', values: { amount: 'ABC' } }],
      }),
    );
    expect(result.errors).toHaveLength(2);
    expect(result.errors.map((error) => error.fieldKey)).toEqual(['companyName', 'amount']);
  });

  it('gera arquivo com milhares de detalhes sem estourar (RNF-12)', () => {
    const details = Array.from({ length: 5000 }, (_, index) => ({
      id: `d${index}`,
      values: { amount: '100' },
    }));
    const result = generateFile(miniStrategy, makeInput({ details }));
    expect(result.lines).toHaveLength(5002);
    expect(result.lines.at(-1)).toContain('0000500000'); // total 500000
  });
});

describe('buildRuler', () => {
  it('retorna string determinística de exatamente 451 caracteres', () => {
    expect(buildRuler()).toHaveLength(451);
  });

  it('marca as posições 1, 11, 21… até 451, independente do leiaute ativo', () => {
    const ruler = buildRuler();
    expect(ruler.startsWith('1')).toBe(true);
    expect(ruler.slice(10, 12)).toBe('11');
    expect(ruler.slice(20, 22)).toBe('21');
    expect(ruler.slice(440, 443)).toBe('441');
    // A marca "451" começa exatamente no último caractere (posição 451 = índice
    // 450); só o primeiro dígito cabe — mesma regra de corte visual usada nas
    // demais marcas quando o rótulo estoura a largura da régua.
    expect(ruler[450]).toBe('4');
  });

  it('é determinística entre chamadas', () => {
    expect(buildRuler()).toBe(buildRuler());
  });
});

describe('assertRecordSpecIsSound', () => {
  const base: RecordSpec = miniStrategy.structure('retorno').fileHeader;

  it('aceita especificação válida', () => {
    expect(() => assertRecordSpecIsSound(base, 20)).not.toThrow();
  });

  it('acusa sobreposição de campos', () => {
    const broken: RecordSpec = {
      id: 'x',
      label: 'X',
      fields: [
        { key: 'a', label: 'A', start: 1, end: 5, type: 'num' },
        { key: 'b', label: 'B', start: 5, end: 8, type: 'num' },
      ],
    };
    expect(() => assertRecordSpecIsSound(broken, 20)).toThrow(/sobrepõe/);
  });

  it('acusa campo além da largura do registro', () => {
    const broken: RecordSpec = {
      id: 'x',
      label: 'X',
      fields: [{ key: 'a', label: 'A', start: 18, end: 25, type: 'num' }],
    };
    expect(() => assertRecordSpecIsSound(broken, 20)).toThrow(/ultrapassa/);
  });
});
