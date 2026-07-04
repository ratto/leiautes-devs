# Auditoria de conformidade — Leiaute RCB001

**Data:** 2026-07-04
**Fonte oficial:** Banco do Brasil — *"Soluções Eletrônicas: Manual Técnico — Débito em Conta via Internet, Leiaute Arquivo Retorno, Formato RCB001"*, versão junho/2015 (PDF fornecido pelo usuário).
**Arquivo auditado:** `src/core/leiautes/strategies/rcb001.ts`

## Achado central

A estratégia `rcb001.ts` **não implementa o leiaute RCB001 do Banco do Brasil**. Ela reimplementa, sob o nome "RCB001", um leiaute genérico de cobrança-retorno herdado do protótipo "Patinho Feio" — o próprio cabeçalho do arquivo assume isso (`rcb001.ts:4-13`). O RCB001 oficial é um **arquivo de retorno de arrecadação/débito em conta via Internet** com registros identificados pelas letras **A** (header), **G** (detalhe) e **Z** (trailer), contendo um campo de **código de barras de 44 posições** no detalhe. Praticamente todos os campos divergem em posição, tamanho e/ou semântica.

O que coincide entre implementação e spec: tamanho de registro (150 bytes), natureza "retorno" do arquivo, e as convenções gerais de alinhamento numérico/alfanumérico.

## Header — Código de Registro `A`

| Campo | Spec oficial (posição) | Código atual (posição) | Situação |
|---|---|---|---|
| Código do Registro | `A(001)`, pos 001 | `'0'`, pos 1 | ❌ errado |
| Código de Remessa | `9(001)`='2', pos 002 | `fileCode`='2', pos 2 | ✅ correto |
| Número do Convênio | `9(006)`, pos 003-008 | **inexistente** (pos 3-19 viram literais `RETORNO`/`COBRANCA`) | ❌ campo obrigatório ausente |
| Sequencial de Retorno EDI | `9(009)`, pos 010-018 | inexistente | ❌ ausente |
| Nome da Empresa/Órgão | `X(020)`, pos 023-042 | `companyName` `X(030)`, pos 067-096 | ❌ posição e tamanho errados |
| Código do Banco | `9(003)` default 001, pos 043-045 | `bankCode`, pos 020-022 | ❌ posição errada |
| Nome do Banco | `X(020)`, pos 046-065 | `bankName`, pos 023-052 | ❌ posição errada |
| Data da Geração do Arquivo | `9(008)` **AAAAMMDD**, pos 066-073 | `generationDate` **DDMMAAAA**, pos 097-104 | ❌ formato e posição errados |
| Número Sequencial do Arquivo | `9(006)`, pos 074-079 | inexistente | ❌ ausente |
| Versão do Leiaute | `9(002)` default 02, pos 080-081 | inexistente | ❌ ausente |
| Agência/Conta creditada | **não existem no header** (pertencem ao detalhe) | `agency`/`agencyDigit`/`account`/`accountDigit`, pos 053-066 | ❌ campos que não deveriam estar aqui |
| Reservado/Uso futuro (A14, vazio p/ comércio eletrônico) | `X(008)`, pos 143-150, deve ficar **vazio** | `sequence` computado, pos 145-150 | ❌ preenche onde a spec exige vazio |

## Detalhe — Código de Registro `G`

| Campo | Spec oficial (posição) | Código atual (posição) | Situação |
|---|---|---|---|
| Código do Registro | `G`, pos 001 | `'1'`, pos 1 | ❌ errado |
| Prefixo/DV Agência creditada | `9(004)`+`X(001)` DV Módulo 11, pos 002-006 | inexistente | ❌ ausente |
| Nº Conta/DV Conta creditada | `9(009)`+`X(001)` DV Módulo 11, pos 007-016 | inexistente (código tem `ourNumber`/`yourNumber`, que não existem na spec) | ❌ ausente / campos inventados |
| Data do Pagamento | `9(008)` **AAAAMMDD**, pos 022-029 | inexistente (código tem `occurrenceDate` DDMMAAAA, pos 026-033) | ❌ ausente/errado |
| Data do Crédito | `9(008)` **AAAAMMDD**, pos 030-037 | `creditDate` DDMMAAAA, pos 076-083 | ❌ posição e formato errados |
| **Código de Barras (G5)** | `X(044)`, pos 038-081, com subcampos G5.1-G5.9 e DV Módulo 10 | **totalmente ausente** | ❌ campo central do leiaute não existe |
| Valor Recebido (G6) | `9(010)v99` = 12 posições, pos 082-093 | `receivedAmount` 12 dígitos, pos 054-065 | ❌ tamanho correto, posição errada |
| Valor da Tarifa (G7) | `9(005)v99` = **7 posições**, pos 094-100 | `feeAmount` **10 dígitos**, pos 066-075 | ❌ tamanho e posição errados |
| Nº Sequencial de Registro (G8) | `9(008)`, pos 101-108 | inexistente (código usa `sequence` genérico, pos 145-150) | ❌ ausente |
| Prefixo Agência Recebedora (G9.1) | `9(004)`, pos 109-112 | inexistente | ❌ ausente |
| Meio de Arrecadação (G10) | `9(001)` — 1 Caixa / 2 Eletrônica / 3 Internet, pos 117 | inexistente | ❌ ausente |
| Autenticação Eletrônica (G11) | `X(023)`, pos 118-140 | inexistente | ❌ ausente |
| Forma de Recebimento (G12) | `9(001)` — 1 Dinheiro / 2 Cheque / 3 Não identificada, pos 141 | inexistente | ❌ ausente |

### Subcampos do Código de Barras (G5, spec oficial — não implementados)

| Subcampo | Posição (dentro do G5) | Descrição |
|---|---|---|
| G5.1 | 01-01 | Código identificação do produto (arrecadação), default `8` |
| G5.2 | 02-02 | Identificação do segmento, default `9` |
| G5.3 | 03-03 | Identificador do valor real ou referência, default `6` |
| G5.4 | 04-04 | Dígito verificador geral — **Módulo 10** |
| G5.5 | 05-15 | Valor em reais (11 posições) |
| G5.6 | 16-19 | Código do BB na compensação, default `0001` |
| G5.7 | 20-21 | Preenchido com `01` |
| G5.8 | 22-27 | Código do convênio RCB |
| G5.9 | 28-44 | Número do pedido (valor de `refTran` gerado pelo conveniado) |

## Trailer — Código de Registro `Z`

| Campo | Spec oficial (posição) | Código atual (posição) | Situação |
|---|---|---|---|
| Código do Registro | `Z`, pos 001 | `'9'`, pos 1 | ❌ errado |
| Total de Registros do Arquivo (**inclusive header e trailer**) | `9(006)`, pos 002-007 | `detailCount` conta só os detalhes, pos 008-013 | ❌ semântica e posição erradas |
| Valor Total Recebido dos Registros | `9(017)`, pos 008-024 | `totalReceived` 14 dígitos, pos 014-027 | ❌ tamanho e posição errados |
| Livre (Z4) | `X(126)`, pos 025-150 | preenchido com `totalTitles` (campo inexistente na spec) e `sequence` | ❌ campos inventados onde deveria ser livre |

## Dígitos verificadores

A spec exige dois algoritmos:

- **Módulo 11** (nota 03) — para o DV do prefixo da agência creditada (G2.2) e do número da conta corrente creditada (G2.4).
- **Módulo 10** (nota 06) — para o dígito verificador geral do código de barras (G5.4).

O projeto já possui `modulo10`/`modulo11` implementados em `src/core/leiautes/check-digits.ts`, mas **nenhum dos dois é usado em `rcb001.ts`**. Os campos de DV atuais (`agencyDigit`, `accountDigit`) são texto livre editável, sem cálculo automático.

## Recomendação

Como praticamente todos os campos divergem, não se trata de ajustar posições isoladas: `rcb001.ts` implementa um layout diferente sob o nome "RCB001". Decisão a tomar:

1. **Reimplementar** a estratégia conforme o RCB001 oficial (registros A/G/Z, campo código de barras com subcampos G5.1-G5.9, DVs Módulo 10/11, datas em AAAAMMDD); ou
2. **Renomear** o layout atual para o que ele realmente é (um cobrança-retorno genérico ao estilo "Patinho Feio") e implementar o RCB001 verdadeiro como uma nova estratégia.

Nenhum código foi alterado como parte desta auditoria.
