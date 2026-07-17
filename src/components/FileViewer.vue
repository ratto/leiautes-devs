<script setup lang="ts">
// Visualizador de arquivo (componente-assinatura, design system §5.5).
// Painel estilo terminal — sempre escuro, como um code block — com:
// - régua de posições (1…240 / 1…400) e numeração de linhas (RF-13);
// - destaque do trecho correspondente ao campo focado no form (RF-14);
// - virtualização para arquivos com milhares de linhas (RNF-12);
// - barra de ações: Copiar e Baixar (RF-15).
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { buildRuler } from '@/core/leiautes';
import { useFileExport } from '@/composables/useFileExport';
import { useFileStore } from '@/stores/file-store';
import { useSettingsStore } from '@/stores/settings-store';

const $q = useQuasar();
const fileStore = useFileStore();
const settings = useSettingsStore();
const { copyContent, downloadFile } = useFileExport();

/** Trecho de linha com marcação de destaque. */
interface LineSegment {
  text: string;
  highlighted: boolean;
}

/** Linha pronta para renderização no virtual scroll. */
interface ViewerLine {
  number: number;
  segments: LineSegment[];
}

const ruler = computed(() => buildRuler());

// Contêiner que rola o conjunto régua + linhas nos dois eixos. É passado como
// scroll-target ao q-virtual-scroll para que ele NÃO crie um scroller próprio:
// sem isso o Quasar aplica a classe `scroll` (overflow: auto) no elemento raiz
// da virtualização, criando um contêiner interno da largura do viewer que
// clipa as linhas após ~80 colunas enquanto a régua rola sozinha (issue #5).
const scrollContainer = ref<HTMLElement | null>(null);

/** Posições focadas por linha (campo em foco no formulário → destaque). */
const highlightByLine = computed(() => {
  const focused = fileStore.focusedField;
  const map = new Map<number, { start: number; end: number }>();
  if (!focused) return map;
  for (const position of fileStore.generated.fieldMap) {
    if (position.fieldKey === focused.fieldKey && position.detailId === focused.detailId) {
      map.set(position.lineIndex, { start: position.start, end: position.end });
    }
  }
  return map;
});

const lines = computed<ViewerLine[]>(() =>
  fileStore.generated.lines.map((text, index) => {
    const highlight = highlightByLine.value.get(index);
    if (!highlight) {
      return { number: index + 1, segments: [{ text, highlighted: false }] };
    }
    // Divide a linha em antes · campo · depois (posições são 1-based).
    return {
      number: index + 1,
      segments: [
        { text: text.slice(0, highlight.start - 1), highlighted: false },
        { text: text.slice(highlight.start - 1, highlight.end), highlighted: true },
        { text: text.slice(highlight.end), highlighted: false },
      ].filter((segment) => segment.text.length > 0),
    };
  }),
);

/** Geração bloqueada? Validação ligada + erros presentes (RF-10). */
const blocked = computed(() => settings.validationEnabled && !fileStore.isValid);

function notifyBlocked(): void {
  const count = fileStore.generated.errors.length;
  $q.notify({
    type: 'negative',
    classes: 'lpd-notify',
    message: `Arquivo com ${count} erro${count > 1 ? 's' : ''} de validação. Corrija os campos ou desligue a validação para forçar o erro.`,
  });
}

async function onCopy(): Promise<void> {
  if (blocked.value) {
    notifyBlocked();
    return;
  }
  const copied = await copyContent();
  $q.notify({
    classes: 'lpd-notify',
    message: copied
      ? 'Conteúdo copiado. Bom teste ☕'
      : 'O navegador bloqueou o acesso à área de transferência.',
    type: copied ? 'positive' : 'warning',
  });
}

function onDownload(): void {
  if (blocked.value) {
    notifyBlocked();
    return;
  }
  downloadFile();
  $q.notify({ classes: 'lpd-notify', type: 'positive', message: 'Arquivo gerado. Bom teste ☕' });
}
</script>

<template>
  <div class="viewer" data-testid="file-viewer">
    <!-- Barra de título estilo terminal -->
    <div class="viewer__bar">
      <span class="viewer__dot" style="background: #f26d6d" aria-hidden="true" />
      <span class="viewer__dot" style="background: #f2c94c" aria-hidden="true" />
      <span class="viewer__dot" style="background: #5fbf8f" aria-hidden="true" />
      <span class="viewer__title lpd-mono" data-testid="viewer-filename">{{
        fileStore.fileName
      }}</span>
      <span
        class="lpd-badge"
        :class="settings.validationEnabled ? 'lpd-badge--ok' : 'lpd-badge--warn'"
        data-testid="viewer-validation-badge"
      >
        <span aria-hidden="true">{{ settings.validationEnabled ? '✓' : '!' }}</span>
        validação: {{ settings.validationEnabled ? 'on' : 'off' }}
      </span>
    </div>

    <!-- Corpo: régua + linhas virtualizadas, roláveis juntas -->
    <div
      ref="scrollContainer"
      class="viewer__scroll"
      tabindex="0"
      aria-label="Conteúdo do arquivo gerado"
    >
      <div class="viewer__ruler lpd-mono" aria-hidden="true">
        <span class="viewer__line-number"> </span>
        <span class="viewer__ruler-text" data-testid="viewer-ruler">{{ ruler }}</span>
      </div>
      <q-virtual-scroll
        v-slot="{ item }: { item: ViewerLine }"
        class="viewer__lines"
        :items="lines"
        :virtual-scroll-item-size="24"
        :scroll-target="scrollContainer ?? undefined"
        data-testid="viewer-lines"
      >
        <div :key="item.number" class="viewer__line lpd-mono">
          <span class="viewer__line-number" aria-hidden="true">{{
            String(item.number).padStart(2, '0')
          }}</span>
          <span class="viewer__line-text"
            ><template v-for="(segment, segmentIndex) in item.segments" :key="segmentIndex"
              ><mark v-if="segment.highlighted" class="viewer__highlight">{{ segment.text }}</mark
              ><template v-else>{{ segment.text }}</template></template
            ></span
          >
        </div>
      </q-virtual-scroll>
    </div>

    <!-- Barra de ações -->
    <div class="viewer__footer">
      <span class="viewer__meta lpd-mono" data-testid="viewer-meta">
        {{ fileStore.generated.lines.length }} linhas · {{ fileStore.strategy.lineLength }} posições
      </span>
      <q-space />
      <q-btn
        flat
        no-caps
        icon="content_copy"
        label="Copiar"
        class="lpd-btn-ghost viewer__action"
        :aria-disabled="blocked"
        data-testid="copy-button"
        @click="onCopy"
      />
      <q-btn
        unelevated
        no-caps
        icon="download"
        label="Baixar arquivo"
        class="lpd-btn-primary viewer__action"
        :aria-disabled="blocked"
        data-testid="download-button"
        @click="onDownload"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
// O terminal é sempre escuro, mesmo no tema claro (como um code block).
.viewer {
  // Dentro do terminal o design é sempre o do dark mode (issue #6):
  // os componentes de marca (botões, badge) herdam estes tokens, então
  // "Copiar", "Baixar arquivo" e o badge de validação mantêm o contraste
  // do tema escuro mesmo quando a página está no light mode.
  --lpd-text: var(--lpd-term-text);
  --lpd-text-muted: var(--lpd-term-muted);
  --lpd-border: var(--lpd-term-border);
  --lpd-surface-2: #2a211a; // Torra Média (hover do botão ghost)
  --lpd-accent: #f2a03d; // Âmbar
  --lpd-accent-hover: #ffb454;
  --lpd-on-accent: #1a1109; // Grão
  --lpd-success: #5fbf8f;
  --lpd-error: #f26d6d;
  --lpd-warning: #f2c94c;

  background: var(--lpd-term-bg);
  border: 1px solid var(--lpd-term-border);
  border-radius: var(--lpd-radius-lg);
  overflow: hidden;
  box-shadow: var(--lpd-shadow-lg);
  display: flex;
  flex-direction: column;
}

.viewer__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 15px;
  background: var(--lpd-term-surface);
  border-bottom: 1px solid var(--lpd-term-border);
}

.viewer__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.viewer__title {
  font-size: 12px;
  color: var(--lpd-term-muted);
  margin-left: 6px;
}

.viewer__bar .lpd-badge {
  margin-left: auto;
}

.viewer__scroll {
  // Único contêiner de scroll do corpo: rola régua + linhas juntas nos dois
  // eixos (o q-virtual-scroll usa este elemento como scroll-target).
  overflow: auto;
  max-height: 456px;
  padding-bottom: 12px;
}

.viewer__ruler {
  display: flex;
  font-size: 12px;
  line-height: 22px;
  color: var(--lpd-term-muted);
  white-space: pre;
  user-select: none;

  // A régua fica sempre visível durante o scroll vertical.
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--lpd-term-bg);
  padding-top: 12px;
}

.viewer__ruler-text {
  white-space: pre;
}

.viewer__lines {
  // O Quasar aplica `contain: content` (inclui `paint`) no conteúdo virtualizado,
  // o que recorta qualquer filho mais largo que o container mesmo com overflow
  // visível no ancestral. Removemos o `paint` para permitir que as linhas
  // ultrapassem a largura do container e o scroll de `.viewer__scroll` funcione
  // até a coluna 451.
  :deep(.q-virtual-scroll__content) {
    contain: layout style;
  }
}

.viewer__line {
  display: flex;
  min-width: calc(451ch + 44px);
  font-size: 12.5px;
  line-height: 24px;
  white-space: pre;
  color: var(--lpd-term-text);

  &:hover {
    background: rgba(245, 233, 214, 0.04);
  }
}

.viewer__line-number {
  flex: 0 0 44px;
  padding: 0 12px 0 15px;
  color: var(--lpd-term-muted);
  user-select: none;
  text-align: right;
  position: sticky;
  left: 0;
  background: var(--lpd-term-bg);
}

.viewer__line-text {
  white-space: pre;
}

// Destaque do campo focado (RF-14) — âmbar com fundo suave
.viewer__highlight {
  background: rgba(242, 160, 61, 0.22);
  color: var(--lpd-accent-hover);
  border-radius: 3px;
  transition: background 0.15s ease;
}

.viewer__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--lpd-term-border);
  flex-wrap: wrap;
}

.viewer__meta {
  font-size: 11.5px;
  color: var(--lpd-term-muted);
}

.viewer__action {
  min-height: 40px;
}
</style>
