<script setup lang="ts">
// Página do gerador: duas colunas em desktop — formulário (esquerda) e
// visualizador do arquivo (direita), conforme o design system §4.4.
// No mobile, as colunas empilham.
import DetailCard from '@/components/DetailCard.vue';
import FileViewer from '@/components/FileViewer.vue';
import LayoutSelector from '@/components/LayoutSelector.vue';
import PrivacySeal from '@/components/PrivacySeal.vue';
import RecordFormSection from '@/components/RecordFormSection.vue';
import ValidationSummary from '@/components/ValidationSummary.vue';
import ValidationToggle from '@/components/ValidationToggle.vue';
import { useFileStore } from '@/stores/file-store';

const fileStore = useFileStore();
</script>

<template>
  <div class="generator">
    <header class="generator__top">
      <div>
        <h1 class="generator__title">Gerador de arquivos</h1>
        <p class="generator__subtitle">
          {{ fileStore.strategy.description }}
        </p>
      </div>
      <PrivacySeal />
    </header>

    <div class="generator__controls">
      <LayoutSelector />
      <ValidationToggle />
    </div>

    <div class="generator__columns">
      <!-- Coluna do formulário -->
      <div class="generator__form">
        <RecordFormSection
          title="Header de Arquivo"
          :fields="fileStore.headerFields"
          :values="fileStore.headerValues"
          @update="(key, value) => fileStore.updateHeaderValue(key, value)"
          @focused="(fieldKey) => fileStore.focusField(fieldKey)"
          @blurred="fileStore.blurField()"
        />

        <RecordFormSection
          v-if="fileStore.batchFields.length > 0"
          title="Header de Lote"
          :fields="fileStore.batchFields"
          :values="fileStore.batchValues"
          @update="(key, value) => fileStore.updateBatchValue(key, value)"
          @focused="(fieldKey) => fileStore.focusField(fieldKey)"
          @blurred="fileStore.blurField()"
        />

        <section class="generator__details" aria-label="Registros-detalhe">
          <header class="generator__details-head">
            <h3 class="generator__details-title">
              Registros-detalhe
              <span class="generator__details-count lpd-mono">{{ fileStore.details.length }}</span>
            </h3>
            <q-btn
              unelevated
              no-caps
              icon="add"
              label="Adicionar registro"
              class="lpd-btn-primary"
              data-testid="add-detail"
              @click="fileStore.addDetail()"
            />
          </header>

          <p v-if="fileStore.details.length === 0" class="generator__empty">
            Nenhum registro-detalhe. Um arquivo sem detalhes é válido para o leiaute — mas
            provavelmente você quer adicionar pelo menos um. ☕
          </p>

          <DetailCard
            v-for="(detail, index) in fileStore.details"
            :key="detail.id"
            :detail="detail"
            :index="index"
          />
        </section>

        <ValidationSummary />
      </div>

      <!-- Coluna do visualizador (sticky em desktop) -->
      <div class="generator__viewer">
        <FileViewer />
        <p class="generator__hint">
          Os trailers e campos calculados (sequenciais, totais, quantidades) são preenchidos
          automaticamente. Foque um campo do formulário para vê-lo aceso no arquivo.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.generator {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.generator__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.generator__title {
  font-size: 32px;
  margin: 0 0 6px;
}

.generator__subtitle {
  color: var(--lpd-text-muted);
  font-size: 15px;
  margin: 0;
}

.generator__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.generator__columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: 1fr;
  }
}

.generator__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.generator__viewer {
  min-width: 0;

  @media (min-width: 1024px) {
    position: sticky;
    top: 88px;
  }
}

.generator__details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.generator__details-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.generator__details-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.generator__details-count {
  font-size: 12px;
  color: var(--lpd-text-muted);
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-full);
  padding: 2px 10px;
}

.generator__empty {
  color: var(--lpd-text-muted);
  font-size: 14px;
  background: var(--lpd-surface);
  border: 1px dashed var(--lpd-border);
  border-radius: var(--lpd-radius-md);
  padding: 18px;
}

.generator__hint {
  color: var(--lpd-text-muted);
  font-size: 13px;
  margin-top: 14px;
}
</style>
