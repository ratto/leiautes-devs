<script setup lang="ts">
// Card de registro-detalhe (componente-assinatura, design system §5.3):
// abre/fecha de forma confiável (RF-06 — estado explícito na store, corrige
// o bug do protótipo), com ações de duplicar e remover (RF-05) e badge de
// status de validação do próprio registro.
import { computed } from 'vue';
import FieldInput from '@/components/FieldInput.vue';
import { useFileStore } from '@/stores/file-store';
import type { DetailEntryState } from '@/stores/file-store';

const props = defineProps<{
  detail: DetailEntryState;
  index: number;
}>();

const fileStore = useFileStore();

/** Erros de validação que pertencem a este detalhe. */
const errorCount = computed(
  () => fileStore.generated.errors.filter((error) => error.detailId === props.detail.id).length,
);

const label = computed(() => `Registro ${String(props.index + 1).padStart(3, '0')}`);
</script>

<template>
  <article class="detail-card" :class="{ 'detail-card--open': detail.expanded }">
    <header class="detail-card__head">
      <button
        class="detail-card__toggle"
        :aria-expanded="detail.expanded"
        :aria-label="`${detail.expanded ? 'Recolher' : 'Expandir'} ${label}`"
        :data-testid="`detail-toggle-${index}`"
        @click="fileStore.toggleDetail(detail.id)"
      >
        <span class="detail-card__chevron" aria-hidden="true">▸</span>
        <strong class="detail-card__label">{{ label }}</strong>
        <span
          class="lpd-badge"
          :class="errorCount === 0 ? 'lpd-badge--ok' : 'lpd-badge--err'"
          :data-testid="`detail-badge-${index}`"
        >
          <span aria-hidden="true">{{ errorCount === 0 ? '✓' : '✗' }}</span>
          {{ errorCount === 0 ? 'válido' : `${errorCount} erro${errorCount > 1 ? 's' : ''}` }}
        </span>
      </button>

      <div class="detail-card__actions">
        <q-btn
          flat
          dense
          round
          icon="content_copy"
          size="sm"
          class="detail-card__action"
          :aria-label="`Duplicar ${label}`"
          :data-testid="`detail-duplicate-${index}`"
          @click="fileStore.duplicateDetail(detail.id)"
        >
          <q-tooltip>Duplicar registro</q-tooltip>
        </q-btn>
        <q-btn
          flat
          dense
          round
          icon="delete_outline"
          size="sm"
          class="detail-card__action detail-card__action--danger"
          :aria-label="`Remover ${label}`"
          :data-testid="`detail-remove-${index}`"
          @click="fileStore.removeDetail(detail.id)"
        >
          <q-tooltip>Remover registro</q-tooltip>
        </q-btn>
      </div>
    </header>

    <div v-if="detail.expanded" class="detail-card__body" :data-testid="`detail-body-${index}`">
      <FieldInput
        v-for="field in fileStore.detailFields"
        :key="field.key"
        :field="field"
        :detail-id="detail.id"
        :model-value="detail.values[field.key] ?? ''"
        @update:model-value="(value) => fileStore.updateDetailValue(detail.id, field.key, value)"
        @focused="(fieldKey, detailId) => fileStore.focusField(fieldKey, detailId)"
        @blurred="fileStore.blurField()"
      />
    </div>
  </article>
</template>

<style scoped lang="scss">
.detail-card {
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-md);
  background: var(--lpd-surface);
  overflow: hidden;
}

.detail-card__head {
  display: flex;
  align-items: center;
  background: var(--lpd-surface-2);
}

.detail-card__toggle {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  min-height: 44px; // alvo de toque
  background: none;
  border: none;
  color: var(--lpd-text);
  font-family: var(--lpd-font-body);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
}

.detail-card__chevron {
  color: var(--lpd-text-muted);
  transition: transform 0.2s ease;
}

.detail-card--open .detail-card__chevron {
  transform: rotate(90deg);
}

.detail-card__label {
  font-weight: 500;
}

.detail-card__actions {
  display: flex;
  gap: 4px;
  padding-right: 10px;
}

.detail-card__action {
  color: var(--lpd-text-muted);

  &:hover {
    color: var(--lpd-text);
  }
}

.detail-card__action--danger {
  color: var(--lpd-error);

  &:hover {
    color: var(--lpd-error);
  }
}

.detail-card__body {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px 12px;
  padding: 16px 14px;
}
</style>
