/**
 * Testes dos dígitos verificadores (módulo 10 e módulo 11).
 * Casos de referência conferidos manualmente com os manuais FEBRABAN.
 */

import { describe, expect, it } from 'vitest';
import { modulo10, modulo11, modulo11Bb } from '@/core/leiautes/check-digits';

describe('modulo10', () => {
  it('calcula o DV de casos conhecidos', () => {
    // 261533 → produtos (da direita p/ esquerda, pesos 2,1,...):
    // 3×2=6, 3×1=3, 5×2=10→1, 1×1=1, 6×2=12→3, 2×1=2 → soma 16 → DV 4
    expect(modulo10('261533')).toBe(4);
  });

  it('retorna 0 quando a soma é múltipla de 10', () => {
    // 55: 5×2=10→1, 5×1=5 → soma 6 → DV 4; usar caso real de resto zero:
    // 91: 1×2=2, 9×1=9 → soma 11 → DV 9. "82": 2×2=4,8→8 → 12 → 8.
    // "19": 9×2=18→9, 1×1=1 → soma 10 → resto 0 → DV 0.
    expect(modulo10('19')).toBe(0);
  });

  it('rejeita entrada não numérica', () => {
    expect(() => modulo10('12A')).toThrow(/apenas dígitos/);
  });
});

describe('modulo11Bb (nota 03 do manual RCB001 do BB)', () => {
  it('reproduz o exemplo do manual (261533 → 9)', () => {
    // 3×2 + 3×3 + 5×4 + 1×5 + 6×6 + 2×7 = 90 → resto 2 → 11−2 = 9
    expect(modulo11Bb('261533')).toBe('9');
  });

  it('não cicla os pesos (crescem 2,3,4… até o primeiro dígito)', () => {
    // '123456789' com pesos 2..10 → soma 210 → resto 1 → DV 10 → 'X'
    expect(modulo11Bb('123456789')).toBe('X');
  });

  it("usa 'X' para DV 10 e '0' para DV 11 (convenção BB)", () => {
    // '6': 6×2 = 12 → resto 1 → DV 10 → 'X'
    expect(modulo11Bb('6')).toBe('X');
    // '0': soma 0 → resto 0 → DV 11 → '0'
    expect(modulo11Bb('0')).toBe('0');
  });

  it('rejeita entrada não numérica', () => {
    expect(() => modulo11Bb('12A')).toThrow(/apenas dígitos/);
  });
});

describe('modulo11', () => {
  it('calcula o DV de casos conhecidos', () => {
    // 823 → 3×2=6, 2×3=6, 8×4=32 → soma 44 → resto 0 → 11-0=11 → DV 0
    expect(modulo11('823')).toBe(0);
    // 85: 5×2=10, 8×3=24 → soma 34 → resto 1 → 11-1=10 → convenção: 0
    expect(modulo11('85')).toBe(0);
    // 26: 6×2=12, 2×3=6 → soma 18 → resto 7 → DV 4
    expect(modulo11('26')).toBe(4);
  });

  it('cicla os pesos de 2 a 9', () => {
    // Nove dígitos "111111111": pesos 2..9 e volta ao 2 →
    // soma = 2+3+4+5+6+7+8+9+2 = 46 → resto 2 → DV 9
    expect(modulo11('111111111')).toBe(9);
  });

  it('rejeita entrada não numérica', () => {
    expect(() => modulo11('1.2')).toThrow(/apenas dígitos/);
  });
});
