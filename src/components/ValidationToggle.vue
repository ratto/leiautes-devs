<script setup lang="ts">
// Toggle global de validação por campo (RF-10) com estado sempre visível.
// Ligado: rules do Quasar bloqueiam arquivo inválido (Marina/Cláudia).
// Desligado: permite forçar erros de propósito (Rafael/QA).
import { useSettingsStore } from '@/stores/settings-store';

const settings = useSettingsStore();
</script>

<template>
  <div class="validation-toggle">
    <q-toggle
      :model-value="settings.validationEnabled"
      color="primary"
      dense
      label="validação por campo"
      aria-label="Habilitar ou desabilitar a validação por campo"
      data-testid="validation-toggle"
      @update:model-value="settings.toggleValidation()"
    />
    <span
      class="lpd-badge"
      :class="settings.validationEnabled ? 'lpd-badge--ok' : 'lpd-badge--warn'"
      data-testid="validation-badge"
    >
      <span aria-hidden="true">{{ settings.validationEnabled ? '✓' : '!' }}</span>
      validação: {{ settings.validationEnabled ? 'on' : 'off' }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.validation-toggle {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--lpd-text-muted);
  font-size: 13px;
}
</style>
