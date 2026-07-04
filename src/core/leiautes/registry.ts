/**
 * Registry das estratégias de leiaute (padrão Strategy).
 *
 * Para adicionar um leiaute novo: criar a estratégia em `strategies/` e
 * registrá-la aqui — nenhuma mudança na UI é necessária (RNF-11).
 */

import { cnab240Strategy } from './strategies/cnab240';
import { cnab400Strategy } from './strategies/cnab400';
import { rcb001Strategy } from './strategies/rcb001';
import type { LayoutId, LayoutStrategy } from './types';

/** Estratégias disponíveis, na ordem de exibição na UI. */
export const layoutStrategies: readonly LayoutStrategy[] = [
  rcb001Strategy,
  cnab240Strategy,
  cnab400Strategy,
];

/** Busca uma estratégia pelo identificador. Lança erro se não registrada. */
export function getLayoutStrategy(id: LayoutId): LayoutStrategy {
  const strategy = layoutStrategies.find((item) => item.id === id);
  if (!strategy) {
    throw new Error(`Leiaute não registrado: ${id}`);
  }
  return strategy;
}
