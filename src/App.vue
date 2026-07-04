<script setup lang="ts">
// Raiz da aplicação: sincroniza o tema da store com o atributo
// `data-theme` do <html> (tokens --lpd-*) e com o dark mode do Quasar.
import { watchEffect } from 'vue';
import { useQuasar } from 'quasar';
import { useSettingsStore } from '@/stores/settings-store';

const $q = useQuasar();
const settings = useSettingsStore();

watchEffect(() => {
  document.documentElement.dataset.theme = settings.theme;
  $q.dark.set(settings.isDark);
});
</script>

<template>
  <router-view />
</template>
