### FDD: MoneyInput - Componente de Entrada de Valor Monetário em Centavos

Versão: 1.0.0
Data: 2026-07-17
Responsável: ratto

---

### 1. Contexto e motivação técnica

Os campos monetários dos formulários de leiaute (RCB001, CNAB240, CNAB400) exibem hoje um número inteiro bruto em centavos. O usuário precisa ver e interagir com o valor no formato de moeda brasileira (R$ X.XXX,XX), mas o contrato interno - integer em centavos - não deve mudar. O componente `<MoneyInput>` pertence à camada View (`src/components/`), sem lógica de negócio; sua responsabilidade é exclusivamente de formatação e mascaramento de apresentação. Ele integra com stores Pinia e composables existentes via `v-model`, mantendo total compatibilidade com os formulários de registro/detalhe atuais.

Os atores envolvidos são: o usuário final (dev ou QA que preenche o formulário de leiaute), o componente pai (formulário de registro/detalhe) e a store Pinia (fonte de verdade do valor em centavos).

---

### 2. Objetivos técnicos

- Exibir valores monetários no formato BRL (R$ X.XXX,XX) sem alterar o contrato integer em centavos - invariante: `update:modelValue` sempre emite `integer >= 0` ou `null`, nunca `NaN` ou negativo.
- Implementar entrada RTL estilo calculadora - invariante: digitar "1", "2", "3", "0", "0" resulta em R$ 1.230,00 e emite `123000`.
- Implementar paste robusto com parser de stripping - invariante: qualquer string colada resulta em estado valido (nunca NaN, nunca negativo).

---

### 3. Escopo e exclusões

**Incluido**
- Componente `<MoneyInput>` em `src/components/MoneyInput.vue`.
- Formatacao de exibicao BRL com prefixo "R$" sempre visivel no campo.
- Entrada RTL estilo calculadora (novos digitos acrescentam-se a direita dos centavos).
- Backspace RTL (remove o digito mais a direita; se nao houver digitos, emite `null`).
- Paste com parser: suporta inteiro puro, decimal com virgula ou ponto; faz stripping de caracteres invalidos.
- Teclas nao-numericas ignoradas silenciosamente, sem alterar o estado.
- Prop `max-digits` configuravel - derivada do tamanho do campo no leiaute; keystroke que ultrapassaria o limite e ignorado.
- Prop `rules` no estilo Quasar, recebendo `number | null` em centavos.
- Pre-fill a partir de valor existente no model (ex.: `15050` exibe R$ 150,50).
- Vue 3 fallthrough attrs para repassar automaticamente `disabled`, `readonly`, `label`, `hint`, `dense`, `outlined`, `error`, `error-message` e demais props do `QInput`.
- Cobertura de testes unitarios com Vitest.

**Excluido**
- Valores negativos (nao fazem parte dos leiautes FEBRABAN suportados).
- Placeholder customizavel - o campo fica em branco quando vazio, exceto pelo prefixo R$.
- Formatacao de outras moedas (somente BRL).
- Persistencia entre sessoes.
- Mascara em campos nao-monetarios.
- Validacao built-in de min/max - essa responsabilidade pertence as `rules` do componente pai.

---

### 4. Fluxos detalhados e diagramas

**Fluxo principal - digitacao**
1. Usuario foca o campo - exibe "R$ " vazio ou o valor pre-carregado formatado.
2. Usuario pressiona digito numerico.
3. Componente acrescenta o digito a direita dos centavos internos (RTL).
4. Reaplica a formatacao BRL ao valor interno acumulado.
5. Emite o novo integer via `update:modelValue`.
6. Usuario continua digitando - repete os passos 2 a 5.
7. Valor exibido atualiza em tempo real; cursor e forcado ao final apos cada atualizacao (`nextTick` + `setSelectionRange`).

**Fluxos alternativos e excecoes**
- Backspace: remove o digito mais a direita da representacao interna. Se nao houver mais digitos, emite `null` e exibe campo em branco (com prefixo R$).
- Paste - inteiro valido (ex.: "1234"): faz stripping, interpreta como reais, multiplica por 100, exibe R$ 1.234,00, emite `123400`.
- Paste - decimal valido com virgula (ex.: "1234,56"): faz stripping, extrai parte inteira e decimal, exibe R$ 1.234,56, emite `123456`.
- Paste - decimal valido com ponto (ex.: "1234.56"): mesmo comportamento do caso com virgula.
- Paste - invalido com resultado nao-vazio apos stripping (ex.: "-50" vira "50"): trata como inteiro, exibe R$ 0,50, emite `50`.
- Paste - invalido com resultado vazio apos stripping (ex.: "abc", "---"): trata como campo vazio, exibe em branco, emite `null`.
- Tecla nao-numerica: ignorada silenciosamente, estado nao muda.
- Keystroke que excede `max-digits`: ignorado, campo nao muda.
- Carregar com valor inicial (ex.: `15050`): exibe R$ 150,50 imediatamente.

---

### 5. Contratos publicos (assinaturas, props, emits, exemplos)

**Contrato 1 - Componente MoneyInput**
- Tipo: Vue SFC (Single-File Component)
- Localizacao: `src/components/MoneyInput.vue`

Props:

| Prop | Tipo | Obrigatorio | Descricao |
| :--- | :--- | :--- | :--- |
| `modelValue` | `number \| null` | sim | Valor em centavos (integer >= 0) ou `null` para campo vazio |
| `maxDigits` | `number` | sim | Numero maximo de digitos permitidos, derivado do tamanho do campo no leiaute |
| `rules` | `Array<(val: number \| null) => true \| string>` | nao | Validacoes no estilo Quasar, recebem o valor em centavos |
| *(demais)* | *(fallthrough)* | nao | Todos os demais atributos do `QInput` via Vue 3 fallthrough attrs |

Emits:

| Evento | Payload | Descricao |
| :--- | :--- | :--- |
| `update:modelValue` | `number \| null` | Emitido a cada mudanca; nunca emite NaN nem valor negativo |

Exemplo de uso:
```vue
<MoneyInput
  v-model="store.valorTitulo"
  :max-digits="13"
  :rules="[val => val !== null || 'Campo obrigatorio']"
  label="Valor do Titulo"
  outlined
  dense
/>
```

Exemplos de contrato v-model:
- Entrada `15050` - exibe "R$ 150,50".
- Usuario digita "1", "2", "3" - emite `1`, depois `12`, depois `123` (R$ 1,23).

---

### 6. Erros, excecoes e fallback

**Matriz de erros previstos e tratamentos**

| Condicao | Tratamento |
| :--- | :--- |
| Paste que, apos stripping, resulta em string vazia | Emite `null`; campo exibe em branco (com prefixo R$) |
| Paste que resulta em "0" ou "00" | Emite `0`; exibe R$ 0,00 (zero e valor valido) |
| Keystroke que excederia `max-digits` | Ignorado silenciosamente; campo nao muda |
| Tecla nao-numerica | Ignorada silenciosamente; estado nao muda |
| `modelValue` recebe tipo inesperado (nao `number` nem `null`) | Tratado como `null`; em modo desenvolvimento emite `console.warn` |

**Estrategia de resiliencia:** n/a - componente client-side sem chamadas de rede (timeouts, retries e circuit breaker nao se aplicam).

**Politica de fallback:** qualquer entrada invalida resulta em `null` (campo vazio) ou no valor stripado nao-negativo. O componente nunca propaga `NaN` ou valor negativo.

**Invariantes:**
- `update:modelValue` nunca emite `NaN`.
- `update:modelValue` nunca emite valor negativo.
- `update:modelValue` emite somente `number >= 0` ou `null`.

---

### 7. Observabilidade

**Metricas**
- N/A (componente client-side; metricas sao responsabilidade da aplicacao consumidora).

**Logs**
- Em modo de desenvolvimento (`import.meta.env.DEV`): `console.warn` quando `modelValue` receber um tipo inesperado (nem `number` nem `null`). Nenhum log em producao.

**Tracing**
- N/A.

**Dashboards e alertas**
- N/A.

---

### 8. Dependencias e compatibilidade

| Componente | Versao minima | Observacoes |
| :--- | :--- | :--- |
| Quasar Framework | >= 2.x | `QInput` e o elemento raiz do template |
| Vue 3 | >= 3.3 | Necessario para fallthrough attrs e o padrao `defineModel` / `v-model` |
| TypeScript | strict mode ativo | Conforme `quasar.config.ts` |
| Vitest | Versao atual do repo | Testes unitarios do componente |

**Garantias de compatibilidade**
- O contrato `v-model` (`modelValue` / `update:modelValue`) e compativel com todos os formularios de leiaute existentes sem alteracoes nos componentes pai.
- O fallthrough attrs garante compatibilidade retroativa com todos os props `QInput` ja utilizados nos formularios (nenhum prop existente precisara ser migrado).
- Nenhuma dependencia externa nova sera adicionada ao projeto.

---

### 9. Criterios de aceite tecnicos

Todos os criterios abaixo devem ser cobertos por testes Vitest:

1. Digitar digitos sequencialmente exibe o valor formatado corretamente (R$ X.XXX,XX) e emite o integer em centavos correspondente.
2. Backspace remove o ultimo digito e desloca os demais para a direita (comportamento RTL estilo calculadora).
3. Apagar todos os digitos emite `null` e o campo exibe apenas o prefixo "R$ ".
4. Carregar o componente com valor inicial (ex.: `15050`) exibe R$ 150,50 imediatamente, sem interacao do usuario.
5. Colar string inteira (ex.: "1234") resulta em R$ 1.234,00 e emite `123400`.
6. Colar string com decimal separado por virgula (ex.: "1234,56") resulta em R$ 1.234,56 e emite `123456`.
7. Colar string com decimal separado por ponto (ex.: "1234.56") resulta em R$ 1.234,56 e emite `123456`.
8. Teclas nao-numericas sao ignoradas sem alterar o valor ou a exibicao.
9. Keystroke que causaria ultrapassagem de `max-digits` e rejeitado e o campo nao muda.
10. A prop `rules` recebe o valor em centavos (integer ou `null`) e faz a mensagem de erro aparecer corretamente via QInput.
11. Atributos `QInput` (`disabled`, `readonly`, `label`, `hint`, `dense`, `outlined`, etc.) sao repassados corretamente via Vue 3 fallthrough attrs e refletem no elemento raiz.

---

### 10. Riscos e mitigacao

**Risco 1 - Cursor/caret do QInput**
Probabilidade: media
Impacto: O `QInput` pode reposicionar o cursor automaticamente apos cada atualizacao programatica do `modelValue`, quebrando a ilusao de entrada RTL. O usuario veria o cursor no meio do valor formatado.
Mitigacao:
- Usar `nextTick` + `setSelectionRange` apos cada atualizacao para forcar o cursor ao final do campo.
- Testar em diferentes navegadores (Chrome, Firefox, Safari) para garantir comportamento uniforme.
Plano de contingencia: se `setSelectionRange` nao funcionar corretamente com o `QInput`, usar um campo de texto `readonly` visivel para exibicao e um `input` oculto para capturar as teclas, delegando apenas a renderizacao ao QInput.

**Risco 2 - Paste com formato inesperado**
Probabilidade: baixa
Impacto: Strings como "R$ 1.234,56", "1 000", "-50" ou "abc" chegam no handler de paste; um parser mal implementado pode resultar em `NaN` ou estado invalido propagado ao store.
Mitigacao:
- Implementar parser defensivo que strip todos os caracteres nao-digito exceto separador decimal (virgula ou ponto); tratar o primeiro separador encontrado como decimal.
- Cobrir todos os casos com testes Vitest dedicados ao parser (incluindo edge cases: string vazia, somente sinais, multiplos separadores, valor zero).
- Se o resultado do strip for vazio, emitir `null` (nunca `NaN` ou negativo).
Plano de contingencia: se um edge case passar pelo parser em producao, o fallback e emitir `null` (campo vazio) - nunca `NaN` ou negativo, preservando a invariante do contrato.
