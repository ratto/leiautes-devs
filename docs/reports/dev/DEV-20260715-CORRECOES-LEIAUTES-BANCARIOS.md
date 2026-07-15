# Relatório de desenvolvimento — Correções de conformidade dos leiautes RCB001, CNAB240 e CNAB400

**Data:** 2026-07-15
**Branch:** `feature/correcoes-leiautes-bancarios` (criada a partir de `main`)
**Origem:** auditorias de conformidade em `docs/reports/rcb001-divergencias.md` e
`docs/reports/cnab240-divergencias.md`, e FDD de correções do CNAB240
**Responsável:** ratto (implementação assistida por Claude Code)

---

## 1. Contexto

As auditorias de conformidade contra os manuais oficiais apontaram divergências
estruturais e semânticas nas três estratégias de leiaute. A mais grave: a
estratégia `rcb001.ts` **não implementava o RCB001 do Banco do Brasil** — ela
reproduzia um leiaute genérico de cobrança herdado do protótipo "Patinho
Feio", com registros 0/1/9 em vez dos registros A/G/Z da spec oficial. Esta
entrega corrige as três estratégias contra suas fontes oficiais:

| Leiaute | Fonte oficial |
|---|---|
| RCB001 | BB — *Manual Técnico Débito em Conta via Internet, Leiaute Arquivo Retorno RCB001*, jun/2015 |
| CNAB240 | FEBRABAN — *Layout Padrão 240 Posições* v10.9 (14/10/2021), layouts '103'/'060' |
| CNAB400 | Itaú — *Cobrança CNAB 400 · Layout de Arquivo 400 bytes*, jan/2017 |

## 2. Alterações no Core (`src/core/leiautes/`)

### 2.1 `check-digits.ts` — novo `modulo11Bb`

Variação do Módulo 11 do Banco do Brasil (nota 03 do manual RCB001): pesos
**crescentes** 2, 3, 4… da direita para a esquerda, sem ciclo, com a convenção
BB para DVs de dois dígitos — 10 → `'X'` e 11 → `'0'` (por isso retorna
string). Usado nos DVs da agência e da conta creditada do registro G.

### 2.2 `formatting.ts` — novo `currentDateAAAAMMDD`

Data corrente no formato AAAAMMDD, padrão do manual RCB001 (diferente do
DDMMAAAA dos CNABs).

### 2.3 `strategies/rcb001.ts` — reescrita para a spec oficial do BB

- **Registros identificados por letra:** header `'A'`, detalhe `'G'`,
  trailer `'Z'` (antes: 0/1/9 do protótipo).
- **Header A:** Número do Convênio (003–008), Sequencial EDI (010–018), Nome
  da Empresa em 20 posições (023–042), Código/Nome do Banco (043–065, default
  001/Banco do Brasil), Data de Geração em AAAAMMDD (066–073), NSA (074–079)
  e Versão do Leiaute `'02'` (080–081). Posições 143–150 vazias (spec A14 para
  comércio eletrônico) — o sequencial indevido foi removido.
- **Detalhe G:** agência/conta creditadas com DVs calculados pelo motor via
  `modulo11Bb` (tolerante a entrada inválida com validação off); Data do
  Pagamento/Crédito em AAAAMMDD; **código de barras (038–081) decomposto nos
  subcampos oficiais G5.1–G5.9**, com DV geral por Módulo 10 (nota 06)
  calculado pelo motor e valor espelhando o Valor Recebido; Número do Pedido
  refTran (065–081); Valor Recebido em 082–093 e Tarifa em 094–100 (7
  posições); sequencial de registro em 101–108; agência recebedora, meio de
  arrecadação, autenticação eletrônica e forma de recebimento (109–141).
- **Trailer Z:** total de registros **inclusive** header e trailer (Z2,
  002–007) e Valor Total Recebido em 17 posições (008–024); posições 025–150
  livres.

### 2.4 `strategies/cnab240.ts` — correções contra a FEBRABAN v10.9

- **DV Agência/Conta combinado** (novo campo `agencyAccountDigit`) no header
  de arquivo (072), header de lote (073), Segmento P (037) e Segmento T (037).
- **Header de arquivo:** Densidade de Gravação editável (a spec não a fixa) e
  campos Reservado ao Banco/à Empresa (172–211).
- **Header de lote:** Data do Crédito (200–207) — editável no retorno, zeros
  na remessa.
- **Segmento P:** Identificação da Emissão/Distribuição do boleto (061–062),
  Agência Cobradora + DV (101–106), Aceite editável, Prazo de Baixa corrigido
  para Alfa (G077), Nº do Contrato da Operação (230–239) e Uso Livre (240).
- **Segmento Q:** CEP separado em CEP (129–133) + Sufixo (134–136); Banco
  Correspondente zerado (fora do escopo, FDD).
- **Segmento T:** DVs como **Num** (particularidade do T na spec), DV da
  Agência Cobradora (105), Nº do Contrato (189–198) e **Motivo da Ocorrência**
  (C047, 214–223) — informação essencial do retorno.
- **Segmento U:** bloco **Ocorrência do Pagador** (154–210: código, data,
  valor e complemento) e campos de banco correspondente zerados (211–233).
- **Trailer de lote:** totais das carteiras Vinculada/Caucionada/Descontada
  zerados (047–115, só a carteira Simples é suportada — premissa do FDD) e
  Número do Aviso de Lançamento (116–123).

### 2.5 `strategies/cnab400.ts` — conformidade com o manual Itaú jan/2017

- **DACs calculados pelo motor** (Módulo 10): DAC da agência/conta (Anexo 3)
  no header e nos detalhes; DAC do nosso número (Anexo 4: agência + conta +
  carteira + nosso número) no retorno.
- **Header de retorno:** Densidade + unidade BPI (101–108), NSA do retorno
  (109–113) e Data de Crédito dos lançamentos (114–119).
- **Detalhe de remessa:** Instrução/Alegação Cancelada zerada (034–037),
  Quantidade de Moeda Variável zerada (071–083), Espécie como Alfa X(02),
  Aceite editável, Instruções 1/2 (157–160), Sacador/Avalista (352–381),
  Data de Mora (386–391) e Prazo (392–393).
- **Detalhe de retorno:** repetição do Nosso Número (086–093 e 127–134) com
  DAC (094); Agência Cobradora editável + DAC (169–173); Espécie (174–175);
  brancos em 189–214 conforme spec (o "Outras Despesas" fora de posição foi
  removido); IOF/Abatimento/Descontos zerados (215–253); Juros de Mora/Multa
  editável (267–279); Outros Créditos zerado (280–292); Data do Crédito como
  Alfa X(06) (296–301); Nome do Pagador (325–354); Erros/Mensagem Informativa
  (378–385, nota 20) e Código de Liquidação (393–394, nota 28).
- **Trailer de retorno:** totalizadores completos — Cobrança Simples
  (018–039), Vinculada e Direta/Escritural zeradas (058–079, 178–199), NSA
  (208–212), Quantidade de Detalhes (213–220) e Valor Total Informado
  (221–234).

## 3. Alterações na View

- `src/pages/LandingPage.vue`: ajuste de formatação dos blocos `<pre>`
  (fechamento de tag na mesma linha), sem mudança de conteúdo.

## 4. Testes

- `test/vitest/check-digits.spec.ts`: suite nova para `modulo11Bb` — exemplo
  do manual (261533 → 9), pesos sem ciclo, convenções 'X'/'0' e rejeição de
  entrada não numérica.
- `test/vitest/formatting.spec.ts`: caso para `currentDateAAAAMMDD`.
- `test/vitest/strategies.spec.ts`: duas suites novas de conformidade —
  **RCB001 × manual do BB** (14 casos: posições dos registros A/G/Z, DVs
  Módulo 11 BB, código de barras com DV Módulo 10, tolerância com validação
  off) e **CNAB400 × manual Itaú** (7 casos: DACs, repetições do nosso número,
  brancos/zeros posicionais, trailer completo), além dos casos novos do
  CNAB240 (Motivo da Ocorrência, Ocorrência do Pagador, DVs numéricos do T,
  carteiras zeradas, Data do Crédito do lote, emissão/distribuição do boleto,
  CEP separado).
- `test/vitest/file-store.spec.ts`: default do banco ajustado
  (`BANCO DO BRASIL`).
- `test/playwright/generator.spec.ts`: fluxo crítico atualizado para os
  campos reais do RCB001 do BB (convênio no header; agência/conta,
  data de pagamento e nº do pedido no detalhe).

## 5. Verificação

- `npm run typecheck` — ✅ sem erros.
- Vitest: **127/127 testes passando** (8 arquivos).
- Cobertura (meta ≥ 85%): **97,37% statements · 83,73% branches · 94,73%
  functions · 98,4% lines**.
- ESLint + Prettier: ✅ limpos em todos os arquivos tocados.
- Playwright: **9/10 na suíte completa**; a falha ("card de registro-detalhe",
  RF-05/06) é **flakiness de timing sob carga** — o teste passa isolado e em
  qualquer subconjunto (verificado em 3 agrupamentos distintos), e falha
  apenas na suíte completa quando a máquina está saturada (timeout default de
  5s na primeira asserção após o goto). Não há regressão funcional; vale
  considerar um timeout maior nesse teste em manutenção futura.
  - Observação operacional: a primeira execução falhou em 4 testes por causa
    de um dev server do Quasar **reaproveitado** (com module graph velho de
    outra branch) exibindo o overlay de erro do vite-plugin-checker, que
    interceptava os cliques. Derrubar o servidor e deixar o Playwright subir
    um novo resolveu — atenção a `reuseExistingServer` ao alternar branches.

## 6. Riscos e observações

- **Quebra de compatibilidade de campos:** chaves de campos do RCB001 mudaram
  (`ourNumber`/`occurrenceDate`/`titleAmount` → `agency`/`account`/
  `paymentDate`/`orderNumber` etc.). Qualquer consumidor de `fieldMap` ou dos
  formulários se ajusta automaticamente (tudo é dirigido pelas `RecordSpec`),
  mas usuários notarão o formulário diferente — mudança intencional de
  conformidade.
- **Premissas documentadas nos cabeçalhos das estratégias** (risco R1 do
  PRD): carteira Simples apenas no CNAB240/400, banco correspondente e
  sacador/avalista fora do escopo no 240, registros opcionais fora do escopo
  no 400, G5.5 espelhando o Valor Recebido no RCB001.
