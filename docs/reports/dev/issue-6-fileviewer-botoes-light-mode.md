# Relatório de desenvolvimento — Issue #6: botão "Copiar" do FileViewer invisível no light mode

- **Issue:** [#6 — Trocar design de botão](https://github.com/ratto/leiautes-devs/issues/6)
- **Branch:** `fix/issue-6-fileviewer-botoes-light-mode` (a partir de `main`)
- **Data:** 2026-07-16

## Problema

O FileViewer é um painel estilo terminal, **sempre escuro** — mesmo no tema claro —
por decisão de design registrada em `src/css/app.scss` (tokens fixos `--lpd-term-*`).
Porém, os botões da barra de ações ("Copiar" e "Baixar arquivo") e o badge de
validação usam os componentes de marca globais (`.lpd-btn-ghost`, `.lpd-btn-primary`,
`.lpd-badge`), que leem os tokens **de tema** (`--lpd-text`, `--lpd-border`,
`--lpd-accent`…).

No light mode, esses tokens assumem valores escuros (ex.: `--lpd-text: #2b1d14`),
resultando em **texto escuro sobre o fundo escuro do terminal** — o botão "Copiar"
ficava praticamente invisível, como reportado na issue.

## Causa-raiz

Descasamento de escopo entre os tokens: o fundo do viewer é fixo (dark), mas os
componentes internos seguiam o tema da página. Nenhum estilo garantia que, dentro
do terminal, os tokens de tema permanecessem nos valores do dark mode.

## Solução

Redefinição dos CSS custom properties de tema no escopo `.viewer`
(`src/components/FileViewer.vue`, `<style scoped>`), fixando-os nos valores do
dark theme. Como custom properties herdam pela árvore DOM, **todos** os componentes
de marca dentro do terminal (botão ghost, botão primário e badge de validação)
passam a renderizar com o design do dark mode em qualquer tema — sem duplicar
estilos de botão nem alterar os componentes globais do design system.

```scss
.viewer {
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
  // ...
}
```

Onde já existiam tokens de terminal (`--lpd-term-text`, `--lpd-term-muted`,
`--lpd-term-border`), eles foram reutilizados; os demais valores são os literais
do dark theme definidos em `src/css/app.scss`.

## Arquivos alterados

| Arquivo | Alteração |
| --- | --- |
| `src/components/FileViewer.vue` | Tokens de tema fixados nos valores dark dentro do escopo `.viewer` |
| `test/playwright/generator.spec.ts` | Novo teste E2E de regressão: no light mode, a cor computada do botão "Copiar" deve ser o creme do terminal (`rgb(245, 233, 214)`) |
| `docs/reports/dev/issue-6-fileviewer-botoes-light-mode.md` | Este relatório |

## Verificação

- `npm run lint` — sem erros.
- `npm run typecheck` — sem erros.
- `npm run test:unit` — 105 testes passando (8 arquivos), sem regressão.
- `npx playwright test test/playwright/generator.spec.ts` — 8 testes passando,
  incluindo o novo caso de regressão da issue #6.
- Verificação visual end-to-end com `quasar dev`: screenshots do FileViewer nos
  dois temas confirmam que o viewer renderiza **idêntico** no dark e no light
  mode — "Copiar" legível (creme com borda), "Baixar arquivo" âmbar com texto
  escuro e badge de validação verde.
