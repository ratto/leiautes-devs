/**
 * Formatação posicional — o coração de qualquer leiaute de largura fixa.
 *
 * Convenções FEBRABAN adotadas:
 * - Campos numéricos (`num`): alinhados à direita, zeros à esquerda.
 * - Campos alfanuméricos (`alfa`): alinhados à esquerda, espaços à direita,
 *   sem acentos e em caixa alta.
 *
 * Decisão deliberada (ver RF-10): a formatação NUNCA trunca valores maiores
 * que o campo. Com a validação global desligada, o usuário pode forçar um
 * campo fora do tamanho de propósito — o arquivo sai malformado, que é
 * exatamente o cenário de teste desejado.
 */

import type { FieldSpec } from './types';

/** Comprimento (em posições) de um campo. */
export function fieldLength(field: Pick<FieldSpec, 'start' | 'end'>): number {
  return field.end - field.start + 1;
}

/**
 * Remove acentos e normaliza para o repertório aceito nos arquivos bancários
 * (ASCII em caixa alta). Ex.: "Cláudia & Cia" → "CLAUDIA & CIA".
 */
export function normalizeAlfa(value: string): string {
  return (
    value
      .normalize('NFD')
      // Remove os diacríticos que sobraram da decomposição (ex.: ´ ~ ç → c)
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
  );
}

/** Preenche à esquerda com zeros até o tamanho — sem truncar excedentes. */
export function padNum(value: string, length: number): string {
  const digits = value.trim();
  return digits.length >= length ? digits : digits.padStart(length, '0');
}

/** Preenche à direita com espaços até o tamanho — sem truncar excedentes. */
export function padAlfa(value: string, length: number): string {
  const text = normalizeAlfa(value);
  return text.length >= length ? text : text.padEnd(length, ' ');
}

/**
 * Formata o valor cru de um campo para ocupar sua janela posicional.
 * Campos vazios viram o preenchimento padrão do tipo (zeros ou espaços).
 */
export function formatFieldValue(field: FieldSpec, rawValue: string): string {
  const length = fieldLength(field);
  const raw = rawValue ?? '';
  return field.type === 'num' ? padNum(raw, length) : padAlfa(raw, length);
}

/** Data corrente no formato DDMMAAAA (padrão dos leiautes suportados). */
export function currentDateDDMMAAAA(now: Date = new Date()): string {
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  return `${dd}${mm}${yyyy}`;
}

/** Data corrente no formato DDMMAA (datas de 6 dígitos do CNAB400). */
export function currentDateDDMMAA(now: Date = new Date()): string {
  return currentDateDDMMAAAA(now).slice(0, 4) + String(now.getFullYear()).slice(-2);
}

/** Data corrente no formato AAAAMMDD (padrão do RCB001 do Banco do Brasil). */
export function currentDateAAAAMMDD(now: Date = new Date()): string {
  const date = currentDateDDMMAAAA(now);
  return date.slice(4) + date.slice(2, 4) + date.slice(0, 2);
}

/** Hora corrente no formato HHMMSS (usada no header do CNAB240). */
export function currentTimeHHMMSS(now: Date = new Date()): string {
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}${mi}${ss}`;
}
