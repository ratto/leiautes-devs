/**
 * Testes da formatação posicional — a base de todo leiaute de largura fixa.
 */

import { describe, expect, it } from 'vitest';
import {
  currentDateDDMMAA,
  currentDateDDMMAAAA,
  currentTimeHHMMSS,
  fieldLength,
  formatFieldValue,
  normalizeAlfa,
  padAlfa,
  padNum,
} from '@/core/leiautes/formatting';
import type { FieldSpec } from '@/core/leiautes/types';

const numField: FieldSpec = { key: 'v', label: 'Valor', start: 1, end: 12, type: 'num' };
const alfaField: FieldSpec = { key: 'n', label: 'Nome', start: 1, end: 10, type: 'alfa' };

describe('fieldLength', () => {
  it('calcula o tamanho a partir das posições inclusivas', () => {
    expect(fieldLength({ start: 1, end: 12 })).toBe(12);
    expect(fieldLength({ start: 54, end: 65 })).toBe(12);
    expect(fieldLength({ start: 7, end: 7 })).toBe(1);
  });
});

describe('normalizeAlfa', () => {
  it('remove acentos e converte para caixa alta', () => {
    expect(normalizeAlfa('Cláudia São João')).toBe('CLAUDIA SAO JOAO');
    expect(normalizeAlfa('ção')).toBe('CAO');
  });

  it('preserva caracteres sem acento', () => {
    expect(normalizeAlfa('EMPRESA TESTE LTDA')).toBe('EMPRESA TESTE LTDA');
  });
});

describe('padNum', () => {
  it('preenche com zeros à esquerda', () => {
    expect(padNum('150000', 12)).toBe('000000150000');
  });

  it('não trunca valores maiores que o campo (validação desligada)', () => {
    expect(padNum('12345', 3)).toBe('12345');
  });
});

describe('padAlfa', () => {
  it('preenche com espaços à direita', () => {
    expect(padAlfa('ABC', 6)).toBe('ABC   ');
  });

  it('normaliza acentos e caixa antes de preencher', () => {
    expect(padAlfa('José', 6)).toBe('JOSE  ');
  });

  it('não trunca valores maiores que o campo', () => {
    expect(padAlfa('ABCDEFGH', 4)).toBe('ABCDEFGH');
  });
});

describe('formatFieldValue', () => {
  it('formata campo numérico com zeros à esquerda', () => {
    expect(formatFieldValue(numField, '150000')).toBe('000000150000');
  });

  it('formata campo alfanumérico com espaços à direita', () => {
    expect(formatFieldValue(alfaField, 'BANCO')).toBe('BANCO     ');
  });

  it('campo vazio vira preenchimento padrão do tipo', () => {
    expect(formatFieldValue(numField, '')).toBe('000000000000');
    expect(formatFieldValue(alfaField, '')).toBe(' '.repeat(10));
  });
});

describe('datas e horas de geração', () => {
  const fixedDate = new Date(2026, 5, 15, 9, 5, 7); // 15/06/2026 09:05:07

  it('gera data no formato DDMMAAAA', () => {
    expect(currentDateDDMMAAAA(fixedDate)).toBe('15062026');
  });

  it('gera data no formato DDMMAA (CNAB400)', () => {
    expect(currentDateDDMMAA(fixedDate)).toBe('150626');
  });

  it('gera hora no formato HHMMSS', () => {
    expect(currentTimeHHMMSS(fixedDate)).toBe('090507');
  });
});
