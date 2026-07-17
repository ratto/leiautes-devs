### FDD: FileViewer — Régua Fixa (451 posições) e Correção de Truncamento

Versão: 1.0
Data: 2026-07-15
Responsável: ratto

---

### 1. Contexto e motivação técnica

O `FileViewer` é o componente-assinatura do produto, responsável por exibir o arquivo bancário gerado em formato estilo terminal com régua de posições e destaque de campos. Dois problemas coexistem:

**Problema 1 — Truncamento de linhas:** o conteúdo das linhas de conteúdo é clipado visualmente entre as colunas 71-81, impedindo a visualização do arquivo completo. A causa raiz é estrutural: a régua (`viewer__ruler`) está fora do `q-virtual-scroll`, portanto o `overflow-x: auto` do container pai (`.viewer__scroll`) funciona corretamente para ela. As linhas de conteúdo, dentro do `q-virtual-scroll`, ficam limitadas à largura do container do componente de virtualização, que não propaga o overflow horizontal.

**Problema 2 — Régua variável por layout:** `buildRuler` recebe `lineLength` como parâmetro e gera uma régua do tamanho exato do layout ativo (150, 240 ou 400 posições). Isso impede que testers visualizem conteúdo além da posição 400 em arquivos CNAB400 propositalmente mal-formados, gerados com validação desligada, para testar o comportamento de sistemas externos diante de entrada inválida.

No HLD, o `FileViewer` pertence à camada View, e `buildRuler` pertence à camada Model (`src/core/leiautes/generator.ts`). A correção toca as duas camadas mas não altera o contrato entre elas além da remoção do parâmetro de `buildRuler`.

**Atores:** desenvolvedores e testers que usam o app para inspecionar e exportar arquivos bancários, incluindo arquivos intencionalmente mal-formados.

---

### 2. Objetivos técnicos

- `buildRuler()` sem parâmetros retorna string determinística de exatamente 451 caracteres, com marcadores a cada 10 posições (1, 11, 21... 441, 451).
- A régua exibida no FileViewer sempre abrange 451 posições, independente do layout ativo.
- Nenhuma linha de conteúdo é clipada antes da coluna 451; o scroll horizontal cobre o intervalo completo.
- Conteúdo além da coluna 451 (gerado apenas em arquivos extremamente mal-formados) é truncado visualmente no limite de 451, sem erro exibido ao usuário.

---

### 3. Escopo e exclusões

**Incluído**
- `src/core/leiautes/generator.ts`: refatoração de `buildRuler` (remoção do parâmetro, constante interna `RULER_LENGTH = 451`).
- `src/components/FileViewer.vue`: atualização do call site de `buildRuler` e correção do truncamento via CSS/estrutura.
- `test/vitest/generator.spec.ts`: atualização dos testes unitários de `buildRuler` para o novo contrato.
- Testes E2E/componente (Playwright): cobertura do novo comportamento da régua e ausência de truncamento.

**Excluído**
- O rodapé (`N posições`) continua exibindo o `lineLength` real da estratégia ativa, não 451.
- A lógica de geração de conteúdo das linhas não é alterada; o truncamento é exclusivamente visual.
- Nenhum novo layout ou estratégia (`LayoutStrategy`) é criado nesta entrega.
- Virtualização (`q-virtual-scroll`) pode ser substituída se a correção exigir, mas a decisão fica a critério da implementação.

---

### 4. Fluxos detalhados e diagramas

**Fluxo principal**
- Usuário seleciona um layout (ex: CNAB400) e preenche o formulário.
- Usuário aciona a geração do arquivo.
- `FileViewer` monta: `buildRuler()` é chamado sem parâmetros e retorna string de 451 chars.
- A régua é exibida com 451 posições.
- As linhas de conteúdo (400 chars para CNAB400) são renderizadas sem truncamento.
- O scroll horizontal do `.viewer__scroll` cobre todo o intervalo de 1 a 451.
- O rodapé exibe `6 linhas · 400 posições` (lineLength real da estratégia).

**Fluxos alternativos e exceções**
- Validação off + arquivo mal-formado: linhas com mais de 400 chars são exibidas até a coluna 451 e truncadas visualmente após esse limite, sem notificação ao usuário.
- Arquivo ainda não gerado: a régua renderiza normalmente (451 posições); a área de linhas exibe estado vazio; nenhum erro é emitido.
- Mudança de layout sem regerar o arquivo: a régua permanece em 451; o rodapé atualiza para o `lineLength` do novo layout imediatamente.

**Diagramas**
```
Usuário
  |
  |-- gera arquivo ---------> fileStore.generated.lines (N linhas, cada uma com lineLength chars)
                                       |
  FileViewer (mount/update)            |
  |-- buildRuler() ----------> string[451]  --> viewer__ruler (fora do q-virtual-scroll)
  |-- lines computed --------> ViewerLine[] --> q-virtual-scroll --> viewer__line (min-width: 451ch + 44px)
  |
  viewer__scroll (overflow-x: auto)
  |-- scroll horizontal cobre régua + linhas juntas
```

---

### 5. Contratos públicos (assinaturas, endpoints, headers, exemplos)

**buildRuler**
- Tipo: function
- Assinatura/Rota: `export function buildRuler(): string`
- Módulo: `src/core/leiautes/generator.ts`
- Exportada via: `src/core/leiautes/index.ts`
- Semântica de status/headers:
  - Constante interna `RULER_LENGTH = 451`
  - Cada dígito ocupa sua posição 1-based na string retornada
  - O char no índice `n-1` corresponde à posição `n` do arquivo

**Exemplo de requisição**
```ts
buildRuler()
```

**Exemplo de resposta**
```
"1         11        21        31        41        51        61        71        81        91        101       111       121       131       141       151       161       171       181       191       201       211       221       231       241       251       261       271       281       291       301       311       321       331       341       351       361       371       381       391       401       411       421       431       441       451"
```

---

**CSS: viewer__line (contrato de renderização)**
- Tipo: regra CSS interna ao componente
- Propriedade adicionada: `min-width: calc(451ch + 44px)`
- Justificativa: `451ch` garante que o conteúdo pré-formatado nunca seja clipado antes da coluna 451, independente da largura do container do `q-virtual-scroll`. Os `44px` correspondem à coluna de número de linha (`viewer__line-number`, `flex: 0 0 44px`).

---

### 6. Erros, exceções e fallback

**Matriz de erros previstos e tratamentos**

| Condição | Tratamento | Notas |
|---|---|---|
| Arquivo não gerado | Régua renderiza; área de linhas vazia; sem erro | Estado normal de entrada vazia |
| Conteúdo de linha maior que 451 chars | Truncamento visual no limite de 451 | Sem notificação; conteúdo no arquivo baixado permanece íntegro |
| `buildRuler` retorna output inesperado | Impossível; função pura e determinística | Sem tratamento necessário |

- Estratégias de resiliência: não aplicável (feature client-side sem I/O externo).
- Política de fallback: não aplicável.
- Invariantes:
  - `buildRuler().length === 451` sempre.
  - O conteúdo do arquivo exportado (Copiar / Baixar) não é afetado por esta feature; a correção é exclusivamente visual.
  - O `lineLength` da estratégia ativa nunca é alterado por esta feature.

---

### 7. Observabilidade

**Métricas**
- Não aplicável (feature client-side sem telemetria de runtime).

**Logs**
- Não aplicável.

**Tracing**
- Não aplicável.

**Dashboards e alertas**
- A cobertura de testes automatizados (Vitest + Playwright) é o mecanismo de observabilidade contínua.
- Inspeção visual via DevTools (DOM/CSS) valida o comportamento durante desenvolvimento.

---

### 8. Dependências e compatibilidade

| Componente | Versão mínima | Observações |
| --- | --- | --- |
| Vue | 3.x | Composition API (`<script setup>`) |
| Quasar | 2.x | `q-virtual-scroll` com suporte a `min-width` via CSS externo |
| TypeScript | 5.x strict | `RULER_LENGTH` como `const` tipada |
| JetBrains Mono | Qualquer | Fonte monospace que define a unidade `ch` usada no min-width |
| Vitest | 2.x | Testes unitários de `buildRuler` |
| Playwright | 1.x | Testes E2E do FileViewer |

**Garantias de compatibilidade**
- A remoção do parâmetro de `buildRuler` é uma quebra de API. Todos os call sites foram verificados (apenas `FileViewer.vue` e `generator.spec.ts`); não há outros consumers.
- O rodapé do viewer não é afetado; `fileStore.strategy.lineLength` permanece a fonte de verdade para o tamanho do layout.
- Nenhuma prop pública do componente `FileViewer` é alterada; não há impacto em quem o utiliza.

---

### 9. Critérios de aceite técnicos

- `buildRuler()` (sem parâmetros) retorna string de exatamente 451 caracteres.
- A régua exibida no FileViewer tem 451 posições para qualquer layout ativo (RCB001, CNAB240, CNAB400).
- Linhas de conteúdo não são clipadas antes da coluna 451 em nenhum layout.
- Scroll horizontal cobre todo o intervalo de 1 a 451 sem quebra de layout ou overflow indesejado.
- O rodapé exibe o `lineLength` real da estratégia ativa, não 451.
- Testes unitários de `buildRuler` em `generator.spec.ts` passam com o novo contrato (sem parâmetro, output de 451 chars).
- Testes E2E cobrem: régua com 451 posições e ausência de truncamento nas linhas de conteúdo.
- Cobertura geral de testes mantida em >= 85%.

---

### 10. Riscos e mitigação

### Quebra silenciosa de consumers de `buildRuler` fora do repo

- **Probabilidade:** baixa
- **Impacto:** build error em projetos externos que importem `buildRuler` com o parâmetro obrigatório.
- **Mitigação:**
    - Busca global por `buildRuler` confirmada antes do merge: apenas 3 arquivos no repo (`generator.ts`, `FileViewer.vue`, `generator.spec.ts`).
    - O projeto não exporta um pacote npm; não há consumers externos conhecidos.
- **Plano de contingência:** se um consumer externo for descoberto, adicionar overload TypeScript `buildRuler(lineLength?: number)` com `lineLength` ignorado e deprecation warning em comentário.

### Imprecisão do `min-width` em `ch` units com fonte não carregada

- **Probabilidade:** média
- **Impacto:** na primeira renderização (antes do carregamento de JetBrains Mono), o `ch` pode ser calculado com a fonte fallback, gerando largura levemente menor que 451 posições reais. O scroll ficaria impreciso até a fonte carregar.
- **Mitigação:**
    - Usar `ch` units (relativo à fonte monospace ativa) em vez de pixels absolutos, garantindo que o valor se ajuste automaticamente após o carregamento.
    - Verificar que JetBrains Mono está declarada no CSS global com `font-display: block` para minimizar o período de fonte fallback.
- **Plano de contingência:** se o desalinhamento for perceptível em testes, substituir `ch` por valor em `px` calculado empiricamente com a fonte carregada (ex: `12.5px * 0.6 * 451 + 44px`).
