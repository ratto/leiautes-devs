# Relatório de Desenvolvimento

> Virtualização da lista de registros-detalhe e criação recolhida de novos registros para conter o consumo de memória (issue #12).

| Data da implementação | Branch |
| --- | --- |
| 18/07/2026 00:49 (24h, horário de Brasília) | `feature/virtualiza-registros-detalhe` |

## Objetivo

Resolver a **issue #12** — "Consumo de memória cresce sem limite com o nº de registros (form não virtualizado), não é leak clássico".

A investigação da issue concluiu que **não há vazamento clássico** (nós DOM retidos e inalcançáveis pelo GC). O que existe é **crescimento ilimitado de DOM vivo**: a lista de registros-detalhe da página `/gerador` não era virtualizada e cada registro nascia expandido, montando ~15 componentes `q-input` pesados que permaneciam no DOM. O consumo crescia de forma linear (~0,85 MB e ~300 listeners por registro), levando a aba a travar com centenas/milhares de registros — exatamente o cenário de um arquivo bancário real.

O visualizador de arquivo (`FileViewer`) já cumpria o RNF-12 (virtualização via `q-virtual-scroll`); a lacuna estava apenas no **formulário**.

A correção combina as duas frentes recomendadas na issue:

1. **Solução definitiva** — virtualizar a lista de registros-detalhe, reaproveitando o `q-virtual-scroll` já usado no `FileViewer`, mantendo o DOM limitado independentemente da quantidade de registros (fecha a lacuna do RNF-12 no formulário).
2. **Paliativo imediato** — criar registros novos e duplicados **recolhidos** (`expanded: false`), montando os inputs só sob demanda (a medição da issue mostrou corte de ~85% no heap).

## Alterações de Código

- `src/stores/file-store.ts` — `addDetail()` e `duplicateDetail()` passam a criar o registro com `expanded: false` (antes `true`). O corpo do `DetailCard` só monta os ~15 `q-input` quando expandido, então nascer recolhido evita inflar o DOM ao gerar/duplicar em massa. O detalhe inicial do estado (`state`) permanece expandido, para o usuário começar a preencher de imediato. Comentários em PT-BR explicam a decisão e referenciam a issue #12.
- `src/pages/GeneratorPage.vue` — a lista `<DetailCard v-for=...>` foi substituída por um `<q-virtual-scroll>` que renderiza apenas os cards da fatia visível (`data-testid="details-scroll"`). Diferente do `FileViewer` (que delega o `scroll-target` por precisar de scroll horizontal), aqui só há scroll vertical, então o próprio componente gerencia a rolagem, com altura limitada via CSS (`.generator__details-list { max-height: 640px }`). Como dentro do virtual scroll o `gap` do flex não se aplica, o respiro entre cards passou a ser `margin-bottom` por card (`:deep(.detail-card)`). Adicionado `import type { DetailEntryState }` para tipar o slot. Os cards têm altura variável (recolhido ~48px, expandido bem maior); o `q-virtual-scroll` mede cada item renderizado e ajusta o cálculo — o mesmo padrão "expansion model" documentado pelo Quasar.

## Testes

- `test/vitest/file-store.spec.ts`:
  - Atualizado "adiciona detalhe recolhido com valores padrão (issue #12)" — agora afirma `expanded === false` no registro adicionado.
  - Adicionado "duplica detalhe recolhido, sem montar os inputs do clone (issue #12)" — garante que o clone nasce recolhido.
  - Adicionado "mantém o primeiro detalhe expandido no estado inicial (UX)" — garante que só os registros criados via add/duplicate nascem recolhidos, preservando a UX de começar com o primeiro card aberto.

Validação executada: `npm run typecheck` (OK), `npm run lint:check` (OK), `npm run test:unit:coverage` — 107 testes passando; cobertura global de 97,35% de statements / 89,24% de branches / 98,2% de linhas (acima da meta de ≥85%).

> Observação de follow-up (fora do escopo deste incremento): o teste E2E `test/playwright/generator.spec.ts` (cenário de duplicar registro) espera o corpo do card duplicado (`detail-body-1`) visível logo após a duplicação. Com o paliativo, o clone nasce recolhido, então esse teste precisará expandir o card antes de verificar o valor. Ajuste de testes Playwright está fora do escopo deste agente e deve ser feito em incremento próprio.

## Detalhes de Uso

| Item | Valor |
| --- | --- |
| Modelo utilizado | `claude-opus-4-8` |
| Tokens de entrada | ~78.000 |
| Tokens de saída | ~9.500 |
| Duração da implementação | ~15min |
