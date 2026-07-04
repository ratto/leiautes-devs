/**
 * Testes do motor de validação — mensagens úteis, em PT-BR, com posição.
 */

import { describe, expect, it } from 'vitest';
import { validateFieldValue, validateRecordValues } from '@/core/leiautes/validation';
import type { FieldSpec, RecordSpec } from '@/core/leiautes/types';

const feeField: FieldSpec = {
  key: 'feeAmount',
  label: 'Valor da Tarifa',
  start: 66,
  end: 75,
  type: 'num',
  editable: true,
};

const nameField: FieldSpec = {
  key: 'companyName',
  label: 'Nome da Empresa',
  start: 67,
  end: 96,
  type: 'alfa',
  editable: true,
  required: true,
};

describe('validateFieldValue', () => {
  it('aceita valor válido', () => {
    expect(validateFieldValue(feeField, '1050')).toBeNull();
  });

  it('aceita campo opcional vazio', () => {
    expect(validateFieldValue(feeField, '')).toBeNull();
  });

  it('acusa obrigatoriedade com a posição do campo', () => {
    expect(validateFieldValue(nameField, '')).toBe(
      'Campo Nome da Empresa: obrigatório (posições 67–96).',
    );
  });

  it('acusa estouro de tamanho dizendo o esperado e o recebido', () => {
    expect(validateFieldValue(feeField, '123456789012')).toBe(
      'Campo Valor da Tarifa: esperado até 10 dígitos, recebido 12 (posições 66–75).',
    );
  });

  it('acusa tipo numérico com caracteres não numéricos', () => {
    expect(validateFieldValue(feeField, '00ABC8')).toBe(
      'Campo Valor da Tarifa: apenas dígitos são aceitos (posições 66–75).',
    );
  });
});

describe('validateRecordValues', () => {
  const record: RecordSpec = {
    id: 'detail',
    label: 'Registro-Detalhe',
    fields: [
      feeField,
      nameField,
      // Campo calculado nunca é validado (produzido pelo motor).
      {
        key: 'sequence',
        label: 'Sequencial',
        start: 145,
        end: 150,
        type: 'num',
        computed: () => '1',
      },
      // Campo fixo (não editável) também não é validado.
      { key: 'recordType', label: 'Tipo', start: 1, end: 1, type: 'num', editable: false },
    ],
  };

  it('valida somente os campos editáveis preenchíveis pelo usuário', () => {
    const errors = validateRecordValues(record, { feeAmount: 'ABC', companyName: '' }, 'det-1');
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({
      recordId: 'detail',
      detailId: 'det-1',
      fieldKey: 'feeAmount',
      fieldLabel: 'Valor da Tarifa',
    });
    expect(errors[1]?.fieldKey).toBe('companyName');
  });

  it('retorna vazio quando tudo é válido', () => {
    const errors = validateRecordValues(record, {
      feeAmount: '1050',
      companyName: 'EMPRESA TESTE',
    });
    expect(errors).toEqual([]);
  });
});
