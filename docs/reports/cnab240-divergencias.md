# Auditoria de conformidade — Leiaute CNAB240

**Data:** 2026-07-05
**Fonte oficial:** FEBRABAN — *"Layout Padrão FEBRABAN 240 Posições"*, versão **10.9** (14/10/2021), seções 2.2 (Header/Trailer de Arquivo) e 3.2.2 "Títulos em Cobrança" (Header/Trailer de Lote e segmentos P, Q, T, U) — PDF fornecido pelo usuário (`Layout padrao CNAB240 V 10 09 - 14_10_21.pdf`).
**Arquivo auditado:** `src/core/leiautes/strategies/cnab240.ts` (apoiado por `formatting.ts` e `generator.ts`).

## Achado central

Ao contrário do RCB001 (que reimplementava outro leiaute sob nome errado), a estratégia `cnab240.ts` **segue de fato a estrutura oficial FEBRABAN de Cobrança** (Header/Trailer de Arquivo, Header/Trailer de Lote, segmentos P+Q na remessa e T+U no retorno). Tamanho de registro (240), convenções de alinhamento (`num` = direita/zeros, `alfa` = esquerda/espaços) e a maioria das posições/tamanhos dos campos batem com a spec.

As divergências encontradas são pontuais, mas duas delas são graves: (1) o **Segmento U não reproduz o bloco de "Ocorrência do Pagador"** (código/data/valor/complemento), que é justamente a informação que diz *por que* um título foi rejeitado ou liquidado no retorno; e (2) o **Trailer de Lote grava um campo inventado ("Valor Total Recebido") sobre posições que a spec reserva para totais de carteira "Vinculada"**, corrompendo a semântica daquelas posições no retorno.

Uma observação transversal importante: o gerador (`generator.ts`) preenche **qualquer** lacuna não mapeada do leiaute com espaços (`padEnd(..., ' ')`), inclusive lacunas correspondentes a campos `Num` da spec que o código simplesmente não declarou. Isso é correto para os campos "CNAB — Uso Exclusivo FEBRABAN" (que a spec define como `Alfa`/brancos), mas é **incorreto** para os campos de negócio numéricos ausentes listados abaixo — a spec exige zeros à esquerda nesses casos, não espaços.

---

## Header de Arquivo (registro tipo `0`)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Código do Banco | 001-003, Num | `bankCode`, 1-3, num | ✅ OK |
| Lote de Serviço | 004-007, Num, `'0000'` | `batchNumber`, 4-7, `'0000'` | ✅ OK |
| Tipo de Registro | 008-008, Num, `'0'` | `recordType`, 8-8, `'0'` | ✅ OK |
| CNAB — Uso Exclusivo | 009-017, Alfa, brancos | não declarado (lacuna preenchida com espaços pelo gerador) | ✅ OK (comportamento equivalente) |
| Tipo de Inscrição da Empresa | 018-018, Num | `companyDocType`, 18-18, num | ✅ OK |
| Número de Inscrição da Empresa | 019-032 (14 dígitos), Num | `companyDocument`, 19-32, num | ✅ OK |
| Código do Convênio no Banco | 033-052 (20), Alfa | `agreementCode`, 33-52, alfa | ✅ OK |
| Agência | 053-057, Num | `agency`, 53-57, num | ✅ OK |
| DV da Agência | 058-058, Alfa | `agencyDigit`, 58-58, alfa | ✅ OK |
| Conta Corrente | 059-070, Num | `account`, 59-70, num | ✅ OK |
| DV da Conta | 071-071, Alfa | `accountDigit`, 71-71, alfa | ✅ OK |
| **DV da Agência/Conta** | 072-072, Alfa | **ausente** (lacuna → espaço) | ⚠️ campo da spec não implementado (efeito prático nulo, já que o default também é branco) |
| Nome da Empresa | 073-102 (30), Alfa | `companyName`, 73-102, alfa | ✅ OK |
| Nome do Banco | 103-132 (30), Alfa | `bankName`, 103-132, alfa | ✅ OK |
| CNAB — Uso Exclusivo | 133-142, Alfa, brancos | não declarado (lacuna) | ✅ OK |
| Código Remessa/Retorno | 143-143, Num | `fileCode`, 143-143, num | ✅ OK |
| Data de Geração do Arquivo | 144-151, Num | `generationDate`, 144-151, num | ✅ OK |
| Hora de Geração do Arquivo | 152-157, Num | `generationTime`, 152-157, num | ✅ OK |
| Número Sequencial do Arquivo (NSA) | 158-163, Num | `fileSequence`, 158-163, num | ✅ OK |
| Nº da Versão do Layout do Arquivo | 164-166, Num, `'103'` | `layoutVersion`, 164-166, `'103'` | ✅ OK |
| Densidade de Gravação | 167-171, Num (sem default fixo na spec — acordado com o banco) | `density`, 167-171, fixo `'01600'` | ⚠️ cosmético — spec não define valor fixo; código trata como constante em vez de editável |
| Reservado Banco | 172-191 (20), Alfa | **ausente** (lacuna → espaço) | ⚠️ campo da spec não implementado (efeito nulo — default também é branco) |
| Reservado Empresa | 192-211 (20), Alfa | **ausente** (lacuna → espaço) | ⚠️ idem |
| CNAB — Uso Exclusivo | 212-240 (29), Alfa | **ausente** (lacuna → espaço) | ✅ OK |

## Header de Lote (registro tipo `1`)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Código do Banco | 001-003, Num | `bankCode` (inherited) | ✅ OK |
| Lote de Serviço | 004-007, Num | `batchNumber`, fixo `'0001'` | ✅ OK (projeto suporta 1 lote — premissa documentada) |
| Tipo de Registro | 008-008, Num, `'1'` | `recordType`, `'1'` | ✅ OK |
| Tipo de Operação | 009-009, Alfa, `'R'` ou `'T'` (G028) | `operationType`, `'R'`/`'T'` conforme `kind` | ✅ OK |
| Tipo de Serviço | 010-011, Num, `'01'` | `serviceType`, `'01'` | ✅ OK |
| CNAB — Uso Exclusivo | 012-013, Alfa | ausente (lacuna) | ✅ OK |
| Nº da Versão do Layout do Lote | 014-016, Num, `'060'` | `batchLayoutVersion`, `'060'` | ✅ OK |
| CNAB — Uso Exclusivo | 017-017, Alfa | ausente (lacuna) | ✅ OK |
| Tipo de Inscrição da Empresa | 018-018, Num | `companyDocType` (inherited) | ✅ OK |
| Número de Inscrição da Empresa | 019-033 (**15 dígitos** — note que difere do header de arquivo, que usa 14) | `companyDocument`, 19-33, num | ✅ OK (o código reformata corretamente o valor herdado para o tamanho de 15 posições deste registro) |
| Código do Convênio no Banco | 034-053 (20), Alfa | `agreementCode`, 34-53, alfa | ✅ OK |
| Agência | 054-058, Num | `agency` (inherited) | ✅ OK |
| DV da Agência | 059-059, Alfa | `agencyDigit` (inherited) | ✅ OK |
| Conta Corrente | 060-071, Num | `account` (inherited) | ✅ OK |
| DV da Conta | 072-072, Alfa | `accountDigit` (inherited) | ✅ OK |
| **DV da Agência/Conta** | 073-073, Alfa | **ausente** (lacuna → espaço) | ⚠️ idem observação do header de arquivo |
| Nome da Empresa | 074-103 (30), Alfa | `companyName` (inherited) | ✅ OK |
| Mensagem 1 | 104-143 (40), Alfa | `message1`, 104-143, alfa | ✅ OK |
| Mensagem 2 | 144-183 (40), Alfa | `message2`, 144-183, alfa | ✅ OK |
| Número Remessa/Retorno | 184-191, Num | `remittanceNumber`, 184-191, num | ✅ OK |
| Data de Gravação Remessa/Retorno | 192-199, Num | `recordDate`, 192-199, num (computado, data corrente) | ✅ OK |
| **Data do Crédito** | 200-207, Num | **ausente** — nenhum campo do registro cobre essas posições | ❌ divergência relevante — campo de negócio numérico ausente; a lacuna gerada preenche com espaços em vez de zeros |
| CNAB — Uso Exclusivo | 208-240 (33), Alfa | ausente (lacuna) | ✅ OK |

## Segmento P — Título (remessa)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Banco / Lote / Tipo de Registro | 001-008 | idem código | ✅ OK |
| Nº Sequencial do Registro no Lote | 009-013, Num | `detailSequence` (computado) | ✅ OK |
| Código do Segmento | 014-014, Alfa, `'P'` | `segmentCode`, `'P'` | ✅ OK |
| CNAB — Uso Exclusivo | 015-015 | ausente (lacuna) | ✅ OK |
| Código de Movimento Remessa | 016-017, Num | `movementCode`, editável, default `'01'` | ✅ OK |
| Agência / DV / Conta / DV | 018-036 | `agency`/`agencyDigit`/`account`/`accountDigit` (inherited) | ✅ OK |
| **DV da Agência/Conta** | 037-037, Alfa | **ausente** (lacuna → espaço) | ⚠️ mesma observação recorrente |
| Nosso Número | 038-057 (20), Alfa | `ourNumber`, 38-57, alfa | ✅ OK |
| Carteira | 058-058, Num | `walletCode`, editável, default `'1'` | ✅ OK |
| Forma de Cadastramento | 059-059, Num | `registrationType`, fixo `'1'` (Cobrança Simples) | ⚠️ escopo reduzido — código não permite Cobrança Vinculada (`'2'`) nem "sem cadastramento" (`'9'`); coerente com o Trailer de Lote (ver abaixo), mas não documentado como limitação |
| Tipo de Documento | 060-060, **Alfa** | `docType`, 60-60, `alfa`, fixo `'1'` | ✅ OK (tipo bate) |
| **Identificação da Emissão do Boleto** | 061-061, Num | **ausente** | ❌ divergência relevante — campo de negócio ausente (define quem emite o boleto) |
| **Identificação da Distribuição do Boleto** | 062-062, Alfa | **ausente** | ❌ divergência relevante — campo ausente |
| Número do Documento de Cobrança | 063-077 (15), Alfa | `documentNumber`, 63-77, alfa | ✅ OK |
| Data de Vencimento do Título | 078-085, Num | `dueDate`, 78-85, num | ✅ OK |
| Valor Nominal do Título | 086-100 (13+2 = 15 posições), Num | `titleAmount`, 86-100, num | ✅ OK |
| **Agência Cobradora** | 101-105, Num | **ausente** | ❌ divergência relevante |
| **DV da Agência Cobradora** | 106-106, Alfa | **ausente** | ❌ divergência relevante |
| Espécie do Título | 107-108, Num | `titleKind`, 107-108, num, default `'02'` | ✅ OK |
| Aceite | 109-109, Alfa (sem default fixo na spec) | `acceptance`, fixo `'N'` | ⚠️ cosmético — spec não define valor fixo; código trata como constante não editável |
| Data de Emissão do Título | 110-117, Num | `issueDate`, 110-117, num | ✅ OK |
| Código/Data/Valor de Juros de Mora | 118-141 | `interestCode`/`interestDate`/`interestAmount`, fixos em zero | ✅ OK (premissa documentada: juros zerados) |
| Código/Data/Valor de Desconto 1 | 142-165 | `discountCode`/`discountDate`/`discountAmount`, fixos em zero | ✅ OK (idem) |
| Valor do IOF | 166-180, Num | `iofAmount`, fixo zero | ✅ OK (idem) |
| Valor do Abatimento | 181-195, Num | `abatementAmount`, fixo zero | ✅ OK (idem) |
| Identificação do Título na Empresa | 196-220 (25), Alfa | `titleId`, 196-220, alfa | ✅ OK |
| Código para Protesto | 221-221, Num | `protestCode`, fixo `'3'` | ✅ OK |
| Prazo para Protesto | 222-223, Num | `protestDays`, fixo `'0'`, tipo `num` | ✅ OK |
| Código para Baixa/Devolução | 224-224, Num | `writeOffCode`, fixo `'1'` | ✅ OK |
| **Prazo para Baixa/Devolução** | 225-227, **Alfa** | `writeOffDays`, 225-227, declarado como **`num`** | ❌ divergência de tipo — spec define `Alfa` (espaços à direita), código usa `num` (zeros à esquerda); como o valor fixo é `'0'`, o byte final coincide por acaso (`'000'` vs. o que seria `'0  '`), mas o comportamento de formatação diverge da spec |
| Código da Moeda | 228-229, Num | `currencyCode`, fixo `'09'` | ✅ OK |
| **Número do Contrato da Operação de Crédito** | 230-239 (10), Num | **ausente** | ❌ divergência relevante |
| **Uso Livre Banco/Empresa** (autorização de pagamento parcial) | 240-240, Alfa | **ausente** (lacuna → espaço) | ⚠️ campo ausente, efeito prático nulo pois default também é branco |

## Segmento Q — Pagador (remessa)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Banco / Lote / Tipo de Registro / Sequencial / Segmento | 001-014 | idem código, `segmentCode='Q'` | ✅ OK |
| Código de Movimento Remessa | 016-017, Num | `movementCode` (inherited do P) | ✅ OK |
| Tipo de Inscrição do Pagador | 018-018, Num | `payerDocType`, default `'1'` | ✅ OK |
| Número de Inscrição do Pagador | 019-033 (15), Num | `payerDocument`, 19-33, num | ✅ OK |
| Nome do Pagador | 034-073 (40), Alfa | `payerName`, 34-73, alfa | ✅ OK |
| Endereço | 074-113 (40), Alfa | `payerAddress`, 74-113, alfa | ✅ OK |
| Bairro | 114-128 (15), Alfa | `payerNeighborhood`, 114-128, alfa | ✅ OK |
| **CEP** | 129-133 (5), Num | `payerZip`, 129-**136**, num | ⚠️ cosmético — a spec separa CEP (129-133) de "Sufixo do CEP" (134-136); o código unifica os dois em um único campo de 8 posições. O byte final ocupa exatamente as mesmas posições 129-136 no formato correto, mas a UI perde a granularidade dos dois campos oficiais |
| **Sufixo do CEP** | 134-136 (3), Num | incorporado ao campo `payerZip` acima | ⚠️ ver item anterior |
| Cidade | 137-151 (15), Alfa | `payerCity`, 137-151, alfa | ✅ OK |
| UF | 152-153, Alfa | `payerState`, 152-153, alfa | ✅ OK |
| Tipo de Inscrição do Sacador/Avalista | 154-154, Num | `guarantorDocType`, fixo `'0'` | ✅ OK (posição correta; funcionalidade de avalista não suportada — ver abaixo) |
| Número de Inscrição do Sacador/Avalista | 155-169 (15), Num | `guarantorDocument`, fixo `'0'` | ✅ OK (idem) |
| **Nome do Sacador/Avalista** | 170-209 (40), Alfa | **ausente** | ❌ divergência relevante — funcionalidade de sacador/avalista incompleta (tipo e documento existem fixos em zero, mas nome nunca é enviado) |
| **Código do Banco Correspondente** | 210-212 (3), Num | **ausente** | ⚠️ divergência (funcionalidade correspondente bancário não suportada) |
| **Nosso Número no Banco Correspondente** | 213-232 (20), Alfa | **ausente** | ⚠️ idem |
| CNAB — Uso Exclusivo | 233-240 (8), Alfa | ausente (lacuna) | ✅ OK |

## Segmento T — Título (retorno)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Banco / Lote / Tipo de Registro / Sequencial / Segmento | 001-014 | idem código, `segmentCode='T'` | ✅ OK |
| Código de Movimento Retorno | 016-017, Num | `movementCode`, default `'06'` | ✅ OK |
| Agência | 018-022, Num | `agency` (inherited) | ✅ OK |
| **DV da Agência** | 023-023, **Num** (spec define `Num` neste registro especificamente, diferente de todos os demais registros do leiaute, que usam `Alfa`) | `agencyDigit`, declarado como `alfa` | ❌ divergência de tipo — no Segmento T a spec exige preenchimento numérico (zeros à esquerda); o código usa alfa (espaços à direita) |
| Conta | 024-035, Num | `account` (inherited) | ✅ OK |
| **DV da Conta** | 036-036, **Num** (idem observação acima) | `accountDigit`, declarado como `alfa` | ❌ divergência de tipo |
| **DV da Agência/Conta** | 037-037, Num | **ausente** (lacuna → espaço) | ⚠️ campo ausente, e a spec aqui pede zero, não espaço |
| Nosso Número | 038-057 (20), Alfa | `ourNumber`, 38-57, alfa | ✅ OK |
| Carteira | 058-058, Num | `walletCode`, default `'1'` | ✅ OK |
| Número do Documento de Cobrança | 059-073 (15), Alfa | `documentNumber`, 59-73, alfa | ✅ OK |
| Data de Vencimento do Título | 074-081, Num | `dueDate`, 74-81, num | ✅ OK |
| Valor Nominal do Título | 082-096 (15), Num | `titleAmount`, 82-96, num | ✅ OK |
| Banco Cobrador/Recebedor | 097-099, Num | `collectingBank`, default `'341'` | ✅ OK |
| Agência Cobradora/Recebedora | 100-104, Num | `collectingAgency`, 100-104, num | ✅ OK |
| **DV da Agência Cobradora/Recebedora** | 105-105, Num | **ausente** | ❌ divergência relevante |
| Identificação do Título na Empresa | 106-130 (25), Alfa | `titleId`, 106-130, alfa | ✅ OK |
| Código da Moeda | 131-132, Num | `currencyCode`, fixo `'09'` | ✅ OK |
| Tipo de Inscrição do Pagador | 133-133, Num | `payerDocType`, default `'1'` | ✅ OK |
| Número de Inscrição do Pagador | 134-148 (15), Num | `payerDocument`, 134-148, num | ✅ OK |
| Nome do Pagador | 149-188 (40), Alfa | `payerName`, 149-188, alfa | ✅ OK |
| **Número do Contrato da Operação de Crédito** | 189-198 (10), Num | **ausente** | ❌ divergência relevante |
| Valor da Tarifa/Custas | 199-213 (15), Num | `feeAmount`, 199-213, num | ✅ OK (correção documentada — RF-11) |
| **Motivo da Ocorrência** (rejeições, tarifas, custas, liquidação e baixas) | 214-223 (10), Alfa | **ausente** | ❌ divergência **bloqueante** — sem esse campo, o retorno não indica o motivo de rejeição/liquidação do título |
| CNAB — Uso Exclusivo | 224-240 (17), Alfa | ausente (lacuna) | ✅ OK |

## Segmento U — Valores (retorno)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Banco / Lote / Tipo de Registro / Sequencial / Segmento | 001-014 | idem código, `segmentCode='U'` | ✅ OK |
| Código de Movimento Retorno | 016-017, Num | `movementCode` (inherited do T) | ✅ OK |
| Juros/Multa/Encargos | 018-032 (15), Num | `accrualsAmount`, editável, default `'0'` | ✅ OK |
| Valor do Desconto Concedido | 033-047 (15), Num | `discountAmount`, fixo `'0'` | ✅ OK |
| Valor do Abatimento Concedido/Cancelado | 048-062 (15), Num | `abatementAmount`, fixo `'0'` | ✅ OK |
| Valor do IOF Recolhido | 063-077 (15), Num | `iofAmount`, fixo `'0'` | ✅ OK |
| Valor Pago pelo Pagador | 078-092 (15), Num | `receivedAmount`, editável, obrigatório | ✅ OK |
| Valor Líquido a ser Creditado | 093-107 (15), Num | `netAmount`, computado (recebido − tarifa) | ✅ OK (correção documentada — RF-07) |
| Valor de Outras Despesas | 108-122 (15), Num | `otherExpenses`, fixo `'0'` | ✅ OK |
| Valor de Outros Créditos | 123-137 (15), Num | `otherCredits`, fixo `'0'` | ✅ OK |
| Data da Ocorrência | 138-145, Num | `occurrenceDate`, editável, obrigatório | ✅ OK |
| Data da Efetivação do Crédito | 146-153, Num | `creditDate`, editável | ✅ OK |
| **Código da Ocorrência do Pagador** (A001) | 154-157 (4), Alfa | **ausente** | ❌ divergência **bloqueante** |
| **Data da Ocorrência (do Pagador)** | 158-165 (8), Alfa | **ausente** | ❌ divergência **bloqueante** |
| **Valor da Ocorrência** | 166-180 (15), Num | **ausente** | ❌ divergência **bloqueante** |
| **Complemento da Ocorrência** | 181-210 (30), Alfa | **ausente** | ❌ divergência **bloqueante** |
| **Código do Banco Correspondente** | 211-213 (3), Num | **ausente** | ⚠️ funcionalidade correspondente bancário não suportada |
| **Nosso Número no Banco Correspondente** | 214-233 (20), Num | **ausente** | ⚠️ idem |
| CNAB — Uso Exclusivo | 234-240 (7), Alfa | ausente (lacuna) | ✅ OK |

> O bloco 154-233 ("Ocorrência do Pagador" + banco correspondente) está **inteiramente ausente** do Segmento U. Como esse bloco concentra o código/motivo/valor da ocorrência informada no retorno, sua falta é o achado mais grave desta auditoria: o arquivo de retorno gerado pela ferramenta não consegue representar por que um título foi liquidado com valor divergente, rejeitado, ou teve qualquer ocorrência do pagador.

## Trailer de Lote (registro tipo `5`)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Banco / Lote / Tipo de Registro | 001-008 | idem código | ✅ OK |
| CNAB — Uso Exclusivo | 009-017 (9), Alfa | ausente (lacuna) | ✅ OK |
| Quantidade de Registros do Lote | 018-023, Num | `batchRecordCount`, computado (`detailCount*2 + 2`) | ✅ OK |
| Quantidade de Títulos em Cobrança **Simples** | 024-029, Num | `titleCount`, computado (`detailCount`) | ✅ OK (rotulado apenas "Quantidade de Títulos"; semântica bate pois só a carteira Simples é suportada) |
| Valor Total dos Títulos em Carteira **Simples** | 030-046 (15), Num | `titleTotal`, computado (soma de `titleAmount`) | ✅ OK |
| Quantidade de Títulos em Cobrança **Vinculada** | 047-052 (6), Num | **ausente** | ⚠️ carteira Vinculada não suportada (coerente com Segmento P sempre fixar `registrationType='1'`) |
| Valor Total dos Títulos em Carteira **Vinculada** | 053-069 (17), Num | **campo `receivedTotal` do código escreve aqui, mas com outro significado ("Valor Total Recebido"), apenas no retorno, nas posições 047-063** | ❌ divergência **bloqueante** — ver detalhamento abaixo |
| Quantidade de Títulos em Cobrança Caucionada | 070-075 (6), Num | ausente | ⚠️ carteira Caucionada não suportada |
| Valor Total dos Títulos em Carteira Caucionada | 076-092 (17), Num | ausente | ⚠️ idem |
| Quantidade de Títulos em Cobrança Descontada | 093-098 (6), Num | ausente | ⚠️ carteira Descontada não suportada |
| Valor Total dos Títulos em Carteira Descontada | 099-115 (17), Num | ausente | ⚠️ idem |
| **Número do Aviso de Lançamento** | 116-123 (8), Alfa | **ausente** | ❌ divergência relevante |
| CNAB — Uso Exclusivo | 124-240 (117), Alfa | ausente (lacuna) | ✅ OK |

### Detalhamento do achado bloqueante do Trailer de Lote

No retorno (`kind === 'retorno'`), o código adiciona um campo extra:

```ts
computed('receivedTotal', 'Valor Total Recebido', 47, 63, 'num', (ctx) =>
  ctx.sumOfDetailField('receivedAmount').toString(),
),
```

A spec **não define** um campo "Valor Total Recebido" no Trailer de Lote — as posições 047-069 pertencem à totalização de **Cobrança Vinculada** (quantidade em 047-052, valor em 053-069). O campo do código, além de representar um conceito que a spec não prevê nesse registro, também está **deslocado**: começa em 047 (dentro da faixa de quantidade) e termina em 063 (dentro da faixa de valor), não coincidindo com nenhuma fronteira de campo da spec. O resultado é que o trailer de lote de um arquivo de retorno gerado pela ferramenta grava, nas posições 047-063, um número que qualquer parser fiel à spec interpretaria como "6 dígitos de quantidade de títulos vinculados + 11 dígitos iniciais do valor total vinculado" — dado sem relação com o valor realmente calculado (soma de `receivedAmount`).

## Trailer de Arquivo (registro tipo `9`)

| Campo | Spec oficial (posição/tipo) | Código atual | Veredito |
|---|---|---|---|
| Código do Banco | 001-003, Num | `bankCode` (inherited) | ✅ OK |
| Lote de Serviço | 004-007, Num, `'9999'` | `batchNumber`, fixo `'9999'` | ✅ OK |
| Tipo de Registro | 008-008, Num, `'9'` | `recordType`, `'9'` | ✅ OK |
| CNAB — Uso Exclusivo | 009-017 (9), Alfa | ausente (lacuna) | ✅ OK |
| Quantidade de Lotes do Arquivo | 018-023, Num | `batchCount`, fixo `'1'` | ✅ OK (premissa documentada: 1 lote por arquivo) |
| Quantidade de Registros do Arquivo | 024-029, Num | `recordCount`, computado (`totalLines`) | ✅ OK |
| **Quantidade de Contas para Conciliação (Lotes)** | 030-035 (6), Num | **ausente** | ⚠️ divergência relevante — campo numérico ausente vira espaços em vez de `'000000'` |
| CNAB — Uso Exclusivo | 036-240 (205), Alfa | ausente (lacuna) | ✅ OK |

## Observações transversais

- **Preenchimento de campos numéricos ausentes.** O gerador (`generator.ts`, função `buildLine`) preenche qualquer lacuna não coberta por um `FieldSpec` com espaços em branco (`line.padEnd(field.start - 1, ' ')`). Isso está correto para os campos "CNAB — Uso Exclusivo FEBRABAN" (que a spec já define como `Alfa`/brancos), mas é **tecnicamente incorreto** para os campos de negócio do tipo `Num` listados como "ausentes" nesta auditoria (ex.: Data do Crédito do Header de Lote, Agência Cobradora do Segmento P, Motivo da Ocorrência do Segmento T, bloco de Ocorrência do Segmento U, totais de carteira Vinculada/Caucionada/Descontada e Quantidade de Contas para Conciliação do Trailer de Arquivo/Lote): a spec exige zeros à esquerda para campos `Num`, e o resultado atual sai com espaços.
- **Nenhum dígito verificador (DV) é calculado no CNAB240.** Diferente do RCB001, a spec FEBRABAN de Cobrança não exige um algoritmo de checksum embutido nos registros — os campos de DV de agência/conta são texto livre fornecido pelo usuário/banco. Isso está coerente com a ausência de uso de `check-digits.ts` em `cnab240.ts`.
- **Escopo da Carteira.** O código fixa `registrationType` (Cadastramento) sempre em `'1'` (Cobrança Simples) no Segmento P, e o Trailer de Lote só totaliza a carteira Simples. Isso é uma decisão de escopo coerente internamente, mas não está documentada nos comentários do arquivo como as demais premissas (juros/descontos zerados, 1 lote por arquivo) — vale documentar essa premissa explicitamente no cabeçalho da estratégia.
- **Funcionalidade de Sacador/Avalista e Banco Correspondente** (Segmento Q, posições 154-232, e Segmento T/U nas posições de banco correspondente) está apenas parcialmente presente (tipo/documento existem fixos em zero) e o nome do avalista e os dados do banco correspondente nunca são enviados — funcionalidade incompleta, não apenas ausente por omissão pontual.

---

## Resumo consolidado das divergências

### Bloqueantes
1. **Segmento U** — bloco inteiro de "Ocorrência do Pagador" (código, data, valor, complemento — posições 154-210) ausente; sem ele o retorno não expressa o motivo de rejeições/ocorrências.
2. **Segmento T** — campo "Motivo da Ocorrência" (214-223) ausente; sem ele o retorno não expressa o motivo de liquidação/rejeição/tarifa do título.
3. **Trailer de Lote** — campo inventado `receivedTotal` ("Valor Total Recebido") grava, nas posições 047-063 do retorno, um valor sem relação com o que a spec define para essas posições (totais de Cobrança Vinculada).
4. **Segmento P** — campos "Identificação da Emissão do Boleto" (061) e "Identificação da Distribuição do Boleto" (062) ausentes; sem eles o arquivo de remessa não informa quem deve emitir/distribuir o boleto.

### Relevantes
5. **Segmento P** — "Prazo de Baixa/Devolução" (225-227) declarado como `num` no código; a spec define `Alfa`.
6. **Segmento T** — "DV da Agência" (023) e "DV da Conta" (036) declarados como `alfa` no código; a spec define `Num` especificamente neste registro.
7. **Segmento P** — "Agência Cobradora" (101-105) e seu DV (106) ausentes.
8. **Segmento T** — "Número do Contrato da Operação de Crédito" (189-198) ausente.
9. **Segmento P** — "Número do Contrato da Operação de Crédito" (230-239) ausente.
10. **Segmento Q** — "Nome do Sacador/Avalista" (170-209) ausente; funcionalidade de avalista incompleta.
11. **Header de Lote** — "Data do Crédito" (200-207) ausente.
12. **Trailer de Lote** — totais de carteira Vinculada/Caucionada/Descontada (047-115) e "Número do Aviso de Lançamento" (116-123) ausentes.
13. **Trailer de Arquivo** — "Quantidade de Contas para Conciliação (Lotes)" (030-035) ausente.
14. **Segmento T** — "DV da Agência Cobradora/Recebedora" (105) ausente.
15. **Segmento Q** — "Código do Banco Correspondente" (210-212) e "Nosso Número no Banco Correspondente" (213-232) ausentes.
16. **Segmento U** — "Código do Banco Correspondente" (211-213) e "Nosso Número no Banco Correspondente" (214-233) ausentes.

### Cosméticos
17. **Segmento Q** — "CEP" (129-133) e "Sufixo do CEP" (134-136) da spec unificados em um único campo `payerZip` de 8 posições; byte final idêntico, mas a UI perde a granularidade dos dois campos oficiais.
18. **Header de Arquivo** — "Densidade de Gravação" (167-171) tratado como constante fixa (`'01600'`); a spec não define um valor fixo (é acordado com o banco), então idealmente seria editável.
19. **Segmento P** — "Aceite" (109) fixado em `'N'`; a spec não define valor fixo para esse campo.
20. **Header de Arquivo / Header de Lote / Segmento P/T** — "DV da Agência/Conta" (combinado) ausente em todos os registros onde a spec o define (posições 072, 073, 037, 037 respectivamente); efeito prático nulo hoje porque o default do campo também é branco, mas vale documentar a lacuna.

Nenhum código foi alterado como parte desta auditoria.
