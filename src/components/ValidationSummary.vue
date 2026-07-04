<script setup lang="ts">
// Resumo de validação do arquivo inteiro (RF-12): contagem de erros e
// navegação até o campo problemático. Respeita o toggle global (RF-10):
// com a validação desligada, o resumo não aponta erros — o usuário está
// forçando cenários malformados de propósito.
import { computed, nextTick } from 'vue';
import { useFileStore } from '@/stores/file-store';
import { useSettingsStore } from '@/stores/settings-store';
import type { FieldValidationError } from '@/core/leiautes';

const fileStore = useFileStore();
const settings = useSettingsStore();

const errors = computed(() => fileStore.generated.errors);

/** Rótulo do local do erro (header, lote ou nº do registro). */
function place(error: FieldValidationError): string {
  if (error.detailId) {
    const index = fileStore.details.findIndex((detail) => detail.id === error.detailId);
    return `registro ${String(index + 1).padStart(3, '0')}`;
  }
  return error.recordId === 'batchHeader' ? 'header de lote' : 'header de arquivo';
}

/** Navega até o campo com erro: expande o card, foca e destaca (RF-12). */
async function goToField(error: FieldValidationError): Promise<void> {
  if (error.detailId) {
    const detail = fileStore.details.find((item) => item.id === error.detailId);
    if (detail && !detail.expanded) fileStore.toggleDetail(detail.id);
  }
  fileStore.focusField(error.fieldKey, error.detailId);
  await nextTick();
  // Foca o input correspondente no formulário. O Quasar repassa atributos
  // desconhecidos (incluindo data-testid) ao <input> nativo do q-input.
  const input = document.querySelector<HTMLInputElement>(
    `input[data-testid="field-${error.fieldKey}"]`,
  );
  input?.focus();
  input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
</script>

<template>
  <div
    v-if="settings.validationEnabled && errors.length > 0"
    class="validation-summary"
    role="alert"
    data-testid="validation-summary"
  >
    <p class="validation-summary__count">
      <span aria-hidden="true">✗</span>
      {{ errors.length }} erro{{ errors.length > 1 ? 's' : '' }} de validação
    </p>
    <ul class="validation-summary__list">
      <li v-for="(error, index) in errors" :key="index">
        <button class="validation-summary__link" @click="goToField(error)">
          <span class="validation-summary__place lpd-mono">{{ place(error) }}</span>
          {{ error.message }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.validation-summary {
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-error);
  border-radius: var(--lpd-radius-md);
  padding: 14px 16px;
}

.validation-summary__count {
  color: var(--lpd-error);
  font-weight: 500;
  font-size: 14px;
  margin: 0 0 8px;
}

.validation-summary__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 180px;
  overflow-y: auto;
}

.validation-summary__link {
  background: none;
  border: none;
  color: var(--lpd-text-muted);
  font-size: 13px;
  font-family: var(--lpd-font-body);
  text-align: left;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--lpd-radius-sm);
  width: 100%;

  &:hover {
    background: var(--lpd-surface-2);
    color: var(--lpd-text);
  }
}

.validation-summary__place {
  color: var(--lpd-accent);
  font-size: 11px;
  margin-right: 8px;
}
</style>
