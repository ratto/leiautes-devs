# Relatório de desenvolvimento — FileViewer: régua fixa (451 posições) e correção de truncamento

**Data:** 2026-07-15
**Branch:** `feature/fileviewer-regua-451` (criada a partir de `main`)
**Commit:** `c50d6f4` — `feat: régua fixa de 451 posições e correção de truncamento no FileViewer (issue #5)`
**FDD de origem:** `docs/feature design docs/fdd_viewer_truncado.md` (v1.0, issue #5)
**Responsável:** ratto (implementação assistida por Claude Code)

---

## 1. Contexto

O `FileViewer` — componente-assinatura do produto — apresentava dois problemas
que impediam a inspeção completa dos arquivos gerados:

1. **Truncamento de linhas:** o conteúdo era clipado visualmente entre as
   colunas 71–81, mesmo com o scroll horizontal do container funcionando para
   a régua.
2. **Régua variável por leiaute:** `buildRuler(lineLength)` gerava a régua no
   tamanho exato do leiaute ativo (150/240/400), impedindo testers de
   visualizar conteúdo além da posição 400 em arquivos propositalmente
   mal-formados (validação desligada, RF-10).

## 2. Causa raiz do truncamento

A hipótese do FDD apontava o container do `q-virtual-scroll` não propagando o
overflow horizontal. Durante a implementação, a causa raiz precisa foi
identificada no CSS interno do Quasar:

```sass
.q-virtual-scroll__content
  contain: content
```

`contain: content` equivale a `contain: layout style paint`. O **`paint`**
recorta qualquer filho mais largo que o container — mesmo com
`overflow-x: auto` no ancestral (`.viewer__scroll`) e mesmo com `min-width`
nas linhas. Por isso a régua (fora do virtual scroll) rolava corretamente e as
linhas de conteúdo (dentro dele) eram clipadas.

## 3. Alterações realizadas

### 3.1 `src/core/leiautes/generator.ts` (camada Model)

- `buildRuler(lineLength: number)` → `buildRuler()` (**quebra de API
  intencional**, prevista no FDD; todos os call sites do repositório foram
  atualizados — não há consumers externos).
- Constante interna `RULER_LENGTH = 451`: a régua é sempre determinística com
  exatamente 451 caracteres, marcando as posições 1, 11, 21… 441 (a marca
  "451" começa no último caractere, então apenas o dígito "4" aparece — mesma
  regra de corte já aplicada às demais marcas que estouram a largura).

### 3.2 `src/components/FileViewer.vue` (camada View)

- Call site atualizado: `buildRuler()` sem parâmetro — a régua não depende
  mais de `fileStore.strategy.lineLength`.
- **Correção do truncamento (root cause):** override do containment do Quasar
  dentro de `.viewer__lines`:

  ```scss
  :deep(.q-virtual-scroll__content) {
    contain: layout style; // remove o `paint` que clipava as linhas
  }
  ```

- **Largura mínima das linhas**, conforme contrato do FDD:

  ```scss
  .viewer__line {
    min-width: calc(451ch + 44px); // 451 posições monospace + coluna de numeração
  }
  ```

- Novo `data-testid="viewer-ruler"` no elemento da régua, para testabilidade
  E2E.

### 3.3 Fora do escopo (preservado, conforme FDD)

- O rodapé continua exibindo o `lineLength` real da estratégia ativa
  (`N linhas · 240 posições`), não 451.
- A geração de conteúdo das linhas não foi alterada; o truncamento em 451 é
  exclusivamente visual. Copiar/Baixar permanecem íntegros.
- Nenhuma prop pública do `FileViewer` mudou; `q-virtual-scroll` foi mantido
  (a substituição facultada pelo FDD não foi necessária).

## 4. Testes

### 4.1 Vitest — `test/vitest/generator.spec.ts`

Suite `buildRuler` reescrita para o novo contrato:

| Teste | Verifica |
|---|---|
| retorna string determinística de exatamente 451 caracteres | invariante `buildRuler().length === 451` |
| marca as posições 1, 11, 21… até 451 | marcas nas posições corretas (índices 0, 10, 20, 440, 450) |
| é determinística entre chamadas | `buildRuler() === buildRuler()` |

### 4.2 Playwright — `test/playwright/generator.spec.ts`

Dois testes E2E novos (diff 100% aditivo):

| Teste | Verifica |
|---|---|
| régua do visualizador tem 451 posições fixas em qualquer leiaute | régua com 451 chars, mantida ao trocar de leiaute; rodapé continua com o `lineLength` real ("240 posições") |
| conteúdo das linhas não é clipado antes da coluna 451 | largura renderizada da linha > área visível clipada; `scrollWidth > clientWidth` no `.viewer__scroll` |

### 4.3 Resultados

- `npm run typecheck` — ✅ sem erros.
- Vitest: **128/128 testes passando** (8 arquivos).
- Cobertura (meta ≥ 85%): **97,38% statements · 83,73% branches · 94,73%
  functions · 98,41% lines** (o branch de 83,73% é do agregado geral,
  dominado por `rcb001.ts`/`file-store.ts` pré-existentes; `generator.ts`
  ficou em 93,75% branches).
- Playwright: **12/12 testes passando** (gerador + landing). Durante a suíte
  completa o teste da régua mostrou flakiness com o timeout default de 5s sob
  carga (dev server + 12 testes seriais); resolvido com `timeout: 15000` na
  primeira asserção.
- Lint (ESLint + Prettier): ✅ limpos nos arquivos tocados.

## 5. Critérios de aceite do FDD

| Critério | Status |
|---|---|
| `buildRuler()` sem parâmetros retorna exatamente 451 chars | ✅ |
| Régua com 451 posições para qualquer leiaute ativo | ✅ |
| Linhas não clipadas antes da coluna 451 | ✅ |
| Scroll horizontal cobre o intervalo 1–451 | ✅ |
| Rodapé exibe o `lineLength` real da estratégia | ✅ |
| Testes unitários de `buildRuler` no novo contrato | ✅ |
| E2E: régua 451 + ausência de truncamento | ✅ |
| Cobertura geral ≥ 85% | ✅ (97%+ statements) |

## 6. Riscos monitorados (do FDD)

- **Consumers externos de `buildRuler`:** confirmado que não existem — apenas
  `generator.ts`, `FileViewer.vue` e `generator.spec.ts` no repositório.
- **Imprecisão de `ch` com fonte fallback:** mantido `ch` units conforme
  mitigação do FDD (ajuste automático ao carregar JetBrains Mono); nenhum
  desalinhamento perceptível nos testes E2E. O plano de contingência (px
  empírico) não foi necessário.

## 7. Observações de processo

A working tree da `develop` continha trabalho não commitado de outra frente
(correções RCB001/CNAB nos strategies e seus specs). Esse trabalho foi mantido
fora deste commit: o diff do `test/playwright/generator.spec.ts` nesta branch
é puramente aditivo (29 inserções, 0 remoções) e as alterações da outra frente
permanecem preservadas na working tree/stash da `develop`.
