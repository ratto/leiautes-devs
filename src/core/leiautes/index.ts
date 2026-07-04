/**
 * Ponto de entrada público do Motor de Leiautes (camada Model).
 * A UI e as stores importam apenas daqui — o interior do motor pode evoluir
 * sem quebrar os consumidores.
 */

export * from './types';
export * from './formatting';
export * from './check-digits';
export * from './validation';
export * from './generator';
export * from './registry';
