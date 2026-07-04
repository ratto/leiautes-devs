<script setup lang="ts">
// Alternância dark/light (RF-17) — com o easter egg canônico da marca.
import { useSettingsStore } from '@/stores/settings-store';

const settings = useSettingsStore();
</script>

<template>
  <q-btn
    flat
    round
    class="theme-toggle"
    :icon="settings.isDark ? 'dark_mode' : 'light_mode'"
    :aria-label="settings.isDark ? 'Ativar tema claro' : 'Ativar tema escuro'"
    data-testid="theme-toggle"
    @click="settings.toggleTheme()"
  >
    <!-- Easter egg canônico do produto — preservar sempre (PRD §7.5) -->
    <q-tooltip class="theme-toggle__tooltip">Darkmode... por sua culpa, Erick! 😄</q-tooltip>
  </q-btn>
</template>

<style scoped lang="scss">
.theme-toggle {
  color: var(--lpd-text);
  border: 1px solid var(--lpd-border);
  background: var(--lpd-surface);

  &:hover {
    background: var(--lpd-surface-2);
  }
}

.theme-toggle__tooltip {
  background: var(--lpd-surface-2);
  color: var(--lpd-text);
  font-family: var(--lpd-font-body);
  font-size: 12px;
}
</style>
