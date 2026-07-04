<script setup lang="ts">
// Selo de privacidade (LGPD) — promessa de marca visível na UI (RNF-03).
</script>

<template>
  <span class="privacy-seal" data-testid="privacy-seal">
    <span class="privacy-seal__lock" aria-hidden="true">🔒</span>
    Seus dados nunca saem do seu navegador.
  </span>
</template>

<style scoped lang="scss">
.privacy-seal {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--lpd-surface-2);
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-md);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--lpd-text-muted);
}

.privacy-seal__lock {
  color: var(--lpd-info);
}
</style>
