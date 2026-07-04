<script setup lang="ts">
// Seção de formulário para um registro fixo (header de arquivo/lote):
// grade responsiva de campos gerada a partir da especificação do Core.
import FieldInput from '@/components/FieldInput.vue';
import type { FieldSpec } from '@/core/leiautes';

defineProps<{
  title: string;
  fields: FieldSpec[];
  values: Record<string, string>;
}>();

const emit = defineEmits<{
  update: [key: string, value: string];
  focused: [fieldKey: string];
  blurred: [];
}>();
</script>

<template>
  <section class="record-section lpd-card" :aria-label="title">
    <h3 class="record-section__title">{{ title }}</h3>
    <div class="record-section__grid">
      <FieldInput
        v-for="field in fields"
        :key="field.key"
        :field="field"
        :model-value="values[field.key] ?? ''"
        @update:model-value="(value) => emit('update', field.key, value)"
        @focused="(fieldKey) => emit('focused', fieldKey)"
        @blurred="emit('blurred')"
      />
    </div>
  </section>
</template>

<style scoped lang="scss">
.record-section {
  padding: 20px;
}

.record-section__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: var(--lpd-text);
}

.record-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px 12px;
}
</style>
