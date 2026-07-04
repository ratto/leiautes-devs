<script setup lang="ts">
// Página 404 — no tom do produto: direto, técnico e cafeinado.
</script>

<template>
  <div class="not-found">
    <p class="not-found__code lpd-mono">404</p>
    <h1 class="not-found__title">Página não encontrada</h1>
    <p class="not-found__text">Essa posição não existe no leiaute. ☕</p>
    <router-link to="/" class="not-found__link">Voltar ao início</router-link>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--lpd-base);
  color: var(--lpd-text);
  text-align: center;
  padding: 24px;
}

.not-found__code {
  font-size: 64px;
  color: var(--lpd-accent);
  margin: 0;
}

.not-found__title {
  font-size: 28px;
  margin: 0;
}

.not-found__text {
  color: var(--lpd-text-muted);
  margin: 0;
}

.not-found__link {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 20px;
  background: var(--lpd-accent);
  color: var(--lpd-on-accent);
  border-radius: var(--lpd-radius-md);
  text-decoration: none;
  font-weight: 500;

  &:hover {
    background: var(--lpd-accent-hover);
  }
}
</style>
