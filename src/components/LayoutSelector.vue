<script setup lang="ts">
// Seletor de leiaute (RF-01): chips RCB001 · CNAB240 · CNAB400 +
// toggle remessa/retorno. Trocar leiaute reconfigura o formulário sem
// recarregar a página (RF-02), preservando campos compatíveis (RF-03).
import { layoutStrategies, useFileStore } from '@/stores/file-store';
import type { FileKind, LayoutId } from '@/core/leiautes';

const fileStore = useFileStore();

/** O leiaute atual suporta o tipo? (RCB001 é somente retorno) */
function kindSupported(kind: FileKind): boolean {
  return fileStore.strategy.kinds.includes(kind);
}

function selectLayout(id: LayoutId): void {
  fileStore.setLayout(id);
}
</script>

<template>
  <div class="layout-selector">
    <div class="layout-selector__chips" role="group" aria-label="Escolher leiaute">
      <button
        v-for="strategy in layoutStrategies"
        :key="strategy.id"
        class="layout-chip"
        :class="{ 'layout-chip--active': strategy.id === fileStore.layoutId }"
        :aria-pressed="strategy.id === fileStore.layoutId"
        :title="strategy.description"
        :data-testid="`layout-chip-${strategy.id}`"
        @click="selectLayout(strategy.id)"
      >
        {{ strategy.label }}
      </button>
    </div>

    <div class="layout-selector__kinds" role="group" aria-label="Tipo de arquivo">
      <button
        v-for="kind in ['remessa', 'retorno'] as const"
        :key="kind"
        class="kind-chip"
        :class="{ 'kind-chip--active': kind === fileStore.kind }"
        :aria-pressed="kind === fileStore.kind"
        :disabled="!kindSupported(kind)"
        :title="kindSupported(kind) ? undefined : `${fileStore.layoutId} não possui ${kind}`"
        :data-testid="`kind-chip-${kind}`"
        @click="fileStore.setKind(kind)"
      >
        {{ kind }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.layout-selector {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.layout-selector__chips,
.layout-selector__kinds {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

// Chips de leiaute — mono, pílula, âmbar quando ativo (design system §5.4)
.layout-chip,
.kind-chip {
  font-family: var(--lpd-font-mono);
  font-size: 13px;
  min-height: 44px; // alvo de toque ≥ 44px
  padding: 7px 16px;
  border-radius: var(--lpd-radius-full);
  background: var(--lpd-surface-2);
  color: var(--lpd-text-muted);
  border: 1px solid var(--lpd-border);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--lpd-text);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.layout-chip--active,
.kind-chip--active {
  background: var(--lpd-accent);
  color: var(--lpd-on-accent);
  border-color: transparent;

  &:hover:not(:disabled) {
    color: var(--lpd-on-accent);
  }
}
</style>
