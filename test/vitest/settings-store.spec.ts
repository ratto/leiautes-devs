/**
 * Testes da store de preferências — tema e toggle global de validação.
 */

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from '@/stores/settings-store';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('tema', () => {
  it('começa no escuro (padrão do produto)', () => {
    const store = useSettingsStore();
    expect(store.theme).toBe('dark');
    expect(store.isDark).toBe(true);
  });

  it('alterna entre escuro e claro', () => {
    const store = useSettingsStore();
    store.toggleTheme();
    expect(store.theme).toBe('light');
    store.toggleTheme();
    expect(store.theme).toBe('dark');
  });
});

describe('toggle de validação (RF-10)', () => {
  it('começa ligado — arquivos confiáveis por padrão', () => {
    const store = useSettingsStore();
    expect(store.validationEnabled).toBe(true);
  });

  it('desliga e religa', () => {
    const store = useSettingsStore();
    store.toggleValidation();
    expect(store.validationEnabled).toBe(false);
    store.toggleValidation();
    expect(store.validationEnabled).toBe(true);
  });
});
