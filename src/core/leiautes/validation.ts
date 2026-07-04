/**
 * Motor genérico de validação de campos posicionais.
 *
 * As mensagens seguem o tom de voz do produto: úteis, em PT-BR, dizendo o
 * campo, o esperado e a posição (ex.: "Campo Valor da Tarifa: esperado até
 * 10 dígitos, recebido 12.").
 *
 * A decisão de aplicar ou não estas regras é da camada de cima (toggle
 * global de validação — RF-10); o motor apenas as fornece.
 */

import { fieldLength } from './formatting';
import type { FieldSpec, FieldValidationError, RecordSpec } from './types';

/**
 * Valida o valor cru de um campo. Retorna a mensagem de erro em PT-BR,
 * ou `null` quando o valor está adequado ao leiaute.
 */
export function validateFieldValue(field: FieldSpec, rawValue: string): string | null {
  const value = (rawValue ?? '').trim();
  const length = fieldLength(field);
  const position = `posições ${field.start}–${field.end}`;

  // Obrigatoriedade: campo requerido não pode ficar vazio.
  if (field.required && value.length === 0) {
    return `Campo ${field.label}: obrigatório (${position}).`;
  }

  if (value.length === 0) {
    return null; // Campo opcional vazio vira preenchimento padrão na geração.
  }

  // Tamanho: valores maiores que a janela posicional quebrariam o leiaute.
  if (value.length > length) {
    const unit = field.type === 'num' ? 'dígitos' : 'caracteres';
    return `Campo ${field.label}: esperado até ${length} ${unit}, recebido ${value.length} (${position}).`;
  }

  // Tipo: campos numéricos aceitam apenas dígitos.
  if (field.type === 'num' && !/^\d+$/.test(value)) {
    return `Campo ${field.label}: apenas dígitos são aceitos (${position}).`;
  }

  return null;
}

/** Valida todos os campos editáveis de um registro preenchido. */
export function validateRecordValues(
  record: RecordSpec,
  values: Record<string, string>,
  detailId?: string,
): FieldValidationError[] {
  const errors: FieldValidationError[] = [];
  for (const field of record.fields) {
    // Campos calculados/fixos são produzidos pelo motor — não há o que validar.
    if (field.computed || field.editable === false) continue;
    const message = validateFieldValue(field, values[field.key] ?? '');
    if (message) {
      errors.push({
        recordId: record.id,
        fieldKey: field.key,
        fieldLabel: field.label,
        message,
        ...(detailId !== undefined ? { detailId } : {}),
      });
    }
  }
  return errors;
}
