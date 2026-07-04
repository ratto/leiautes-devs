/**
 * Store de preferências da sessão (ViewModel).
 *
 * IMPORTANTE (LGPD / RNF-02): nenhum estado é persistido em localStorage,
 * sessionStorage ou cookies. Tudo vive em memória e morre com a aba —
 * decisão de arquitetura do produto, não uma feature faltando.
 */

import { defineStore } from 'pinia';

export type ThemeName = 'dark' | 'light';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    /** Tema visual — escuro por padrão ("Darkmode... por sua culpa, Erick!"). */
    theme: 'dark',
    /**
     * Toggle global de validação por campo (RF-10).
     * Ligado (padrão): as rules do Quasar bloqueiam arquivo inválido.
     * Desligado: o usuário pode forçar erros de propósito para testar
     * como o sistema-alvo reage a arquivos malformados.
     */
    validationEnabled: true,
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
  },

  actions: {
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
    },

    toggleValidation() {
      this.validationEnabled = !this.validationEnabled;
    },
  },
});
