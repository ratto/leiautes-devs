/**
 * Dígitos verificadores usados pelos leiautes bancários brasileiros.
 *
 * - Módulo 10: usado em agência/conta e no dígito de campos de código de
 *   barras (pesos alternados 2 e 1, soma dos dígitos dos produtos).
 * - Módulo 11: usado em "nosso número" e no DV geral do código de barras
 *   (pesos cíclicos de 2 a 9, da direita para a esquerda).
 *
 * Referência: manuais FEBRABAN de cobrança (CNAB240/CNAB400).
 */

/** Garante que a entrada contém apenas dígitos (defesa do motor). */
function assertDigits(value: string, fn: string): void {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${fn}: entrada deve conter apenas dígitos, recebido "${value}"`);
  }
}

/**
 * Calcula o dígito verificador por módulo 10.
 * Pesos 2,1,2,1… aplicados da direita para a esquerda; produtos com dois
 * dígitos têm seus algarismos somados (ex.: 7×2=14 → 1+4=5).
 */
export function modulo10(value: string): number {
  assertDigits(value, 'modulo10');
  let sum = 0;
  let weight = 2;
  for (let i = value.length - 1; i >= 0; i--) {
    const product = Number(value[i]) * weight;
    // Soma dos algarismos do produto (produto máximo é 18, então basta -9)
    sum += product > 9 ? product - 9 : product;
    weight = weight === 2 ? 1 : 2;
  }
  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
}

/**
 * Calcula o dígito verificador por módulo 11 (variação bancária).
 * Pesos 2..9 cíclicos da direita para a esquerda.
 * Quando o resto é 0 ou 1 (DV teórico 11 ou 10), o dígito convenciona-se 0
 * — variação mais comum em "nosso número"; bancos específicos podem divergir
 * (risco R1 do PRD: tratar como extensão da estratégia quando necessário).
 */
export function modulo11(value: string): number {
  assertDigits(value, 'modulo11');
  let sum = 0;
  let weight = 2;
  for (let i = value.length - 1; i >= 0; i--) {
    sum += Number(value[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const remainder = sum % 11;
  const dv = 11 - remainder;
  return dv >= 10 ? 0 : dv;
}

/**
 * Módulo 11 na variação do Banco do Brasil (nota 03 do manual RCB001):
 * pesos CRESCENTES 2, 3, 4… da direita para a esquerda, sem ciclo, e
 * DV = 11 − (soma % 11). Convenção BB para os resultados de dois dígitos:
 * 10 → 'X' e 11 → '0' (por isso o retorno é string, não número).
 * Usado nos DVs da agência e da conta creditada do registro G do RCB001.
 */
export function modulo11Bb(value: string): string {
  assertDigits(value, 'modulo11Bb');
  let sum = 0;
  let weight = 2;
  for (let i = value.length - 1; i >= 0; i--) {
    sum += Number(value[i]) * weight;
    weight += 1;
  }
  const dv = 11 - (sum % 11);
  if (dv === 11) return '0';
  if (dv === 10) return 'X';
  return String(dv);
}
