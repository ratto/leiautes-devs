/**
 * Auxiliares para declarar especificações de campo de forma concisa nas
 * estratégias de leiaute. Sem eles, cada estratégia teria centenas de
 * linhas de objetos repetitivos — com eles, cada campo é uma linha legível.
 */

import type { ComputeContext, FieldSpec, FieldType } from '../types';

/** Opções adicionais de um campo editável. */
interface EditableOptions {
  required?: boolean;
  defaultValue?: string;
  hint?: string;
}

/** Campo editável pelo usuário no formulário. */
export function editable(
  key: string,
  label: string,
  start: number,
  end: number,
  type: FieldType,
  options: EditableOptions = {},
): FieldSpec {
  return { key, label, start, end, type, editable: true, ...options };
}

/** Campo fixo do leiaute (literais, códigos de registro) — oculto na UI. */
export function fixed(
  key: string,
  label: string,
  start: number,
  end: number,
  type: FieldType,
  value: string,
): FieldSpec {
  return { key, label, start, end, type, editable: false, defaultValue: value };
}

/** Campo calculado pelo motor na geração (sequenciais, totais, datas…). */
export function computed(
  key: string,
  label: string,
  start: number,
  end: number,
  type: FieldType,
  compute: (ctx: ComputeContext) => string,
): FieldSpec {
  return { key, label, start, end, type, editable: false, computed: compute };
}

/**
 * Campo somente leitura que reaproveita um valor preenchido em outro
 * registro (ex.: banco do header repetido no detalhe). O gerador mescla os
 * valores do header nos registros seguintes, então basta não ser editável.
 */
export function inherited(
  key: string,
  label: string,
  start: number,
  end: number,
  type: FieldType,
): FieldSpec {
  return { key, label, start, end, type, editable: false };
}
