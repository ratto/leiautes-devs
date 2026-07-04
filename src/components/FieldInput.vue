<script setup lang="ts">
// Input de campo posicional: q-input com as rules do Core (RF-09),
// fonte mono para dados (design system §3) e eventos de foco para o
// destaque no visualizador (RF-14).
import { computed } from 'vue';
import { useFieldRules } from '@/composables/useFieldRules';
import { fieldLength } from '@/core/leiautes';
import type { FieldSpec } from '@/core/leiautes';

const props = defineProps<{
  field: FieldSpec;
  modelValue: string;
  /** Identificador do detalhe dono do campo (quando aplicável). */
  detailId?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  focused: [fieldKey: string, detailId?: string];
  blurred: [];
}>();

const rules = useFieldRules(props.field);

/** Dica exibida: a do leiaute + posição, no tom "útil" do produto. */
const hint = computed(() => {
  const positions = `pos. ${props.field.start}–${props.field.end}`;
  return props.field.hint ? `${props.field.hint} · ${positions}` : positions;
});

const maxLength = computed(() => fieldLength(props.field));
</script>

<template>
  <q-input
    :model-value="modelValue"
    outlined
    dense
    no-error-icon
    class="field-input lpd-field-mono"
    :label="field.label"
    :hint="hint"
    :rules="rules"
    :counter="false"
    :maxlength="undefined"
    :aria-label="field.label"
    :data-testid="`field-${field.key}`"
    lazy-rules="ondemand"
    hide-bottom-space
    @update:model-value="emit('update:modelValue', String($event ?? ''))"
    @focus="emit('focused', field.key, detailId)"
    @blur="emit('blurred')"
  >
    <template #append>
      <span class="field-input__size lpd-mono" aria-hidden="true">{{ maxLength }}</span>
    </template>
  </q-input>
</template>

<style scoped lang="scss">
.field-input {
  :deep(.q-field__label) {
    font-size: 13px;
  }

  :deep(.q-field__messages) {
    font-size: 12px;
  }

  // Erro em --lpd-error, mensagem amarrada ao campo pelo Quasar
  // (aria-describedby é gerado automaticamente pelo q-input).
  :deep(.q-field__messages [role='alert']) {
    color: var(--lpd-error);
  }
}

// Indicador discreto do tamanho do campo (nº de posições)
.field-input__size {
  font-size: 10px;
  color: var(--lpd-text-muted);
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-sm);
  padding: 1px 5px;
}
</style>
