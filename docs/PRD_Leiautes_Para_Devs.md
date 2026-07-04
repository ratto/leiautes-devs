# PRD — Leiautes Para Devs

> **Documento de Requisitos de Produto (Product Requirements Document)**
> Gerador de arquivos bancários homologados pela FEBRABAN, feito por dev, para dev.

|                   |                                                                 |
| ----------------- | --------------------------------------------------------------- |
| **Produto**       | Leiautes Para Devs                                              |
| **Versão do PRD** | 1.0                                                             |
| **Status**        | Draft para validação                                            |
| **Autor**         | Pedro Paixão (Product Owner / Dev)                              |
| **Data**          | Junho de 2026                                                   |
| **Sucessor de**   | `arquivo-bancario-generator` (protótipo "Patinho Feio", v1.0.0) |
| **Stack-alvo**    | Quasar.js + Vite + Vue 3 + TypeScript + Pinia                   |
| **Tipo**          | Web app client-side, sem backend de persistência                |

---

## 1. Sumário executivo

**Leiautes Para Devs** é uma ferramenta web especializada na **geração de arquivos bancários** (remessa e retorno) em leiautes homologados pela FEBRABAN — começando por **RCB001**, **CNAB240** e **CNAB400**. O público não é o financeiro de uma empresa: são **desenvolvedores, QAs, testers e analistas de integração** que precisam de arquivos válidos, realistas e parametrizáveis para **alimentar e testar seus próprios sistemas**.

O diferencial central é o foco no fluxo de desenvolvimento e a **privacidade por arquitetura**: nada é persistido em banco de dados. Todo o estado vive em memória (Pinia), pelo tempo da sessão do usuário, em total aderência à **LGPD**. O usuário gera, copia ou baixa o arquivo — e ao fechar a aba, não sobra rastro.

É também a evolução planejada de um protótipo (codinome _Patinho Feio_) escrito sem rigor de engenharia. Esta versão nasce sob **TDD, princípios SOLID e componentização** (com forte incentivo a comentários no código), atende **exclusivamente** quem lida com bancos brasileiros — interface **100% em PT-BR, sem i18n**, e código com nomenclatura em inglês comentado em português — e mantém a marca de origem: **café extra-forte** como assinatura de produto.

---

## 2. Contexto e problema

### 2.1 O problema real

Quem desenvolve ou testa integrações bancárias enfrenta um gargalo recorrente: para validar o parsing, a importação ou o processamento de arquivos de remessa/retorno, **é preciso ter o arquivo na mão** — e consegui-lo costuma significar uma destas opções, todas ruins:

- **Montar à mão** strings de 240/400 posições, contando caractere por caractere (lento, repetitivo, altamente propenso a erro).
- **Depender do banco** ou de um sistema de produção para "cuspir" um arquivo real (burocrático, lento, e expõe dados sensíveis de clientes).
- **Escrever uma lib/script só para gerar massa de teste** (reinventa a roda a cada projeto).

O resultado é tempo perdido, ciclos de teste travados e o risco de versionar acidentalmente dados bancários reais em ambiente de testes.

### 2.2 Por que agora

O protótipo validou a hipótese: existe demanda por uma geração rápida e confiável de arquivos de retorno. O _Patinho Feio_ provou o conceito, mas chegou ao teto técnico (ferramenta monolítica em `ArquivoView.vue`, baixa cobertura de testes, bugs de UI). Para escalar em leiautes, qualidade e confiança, é hora de reconstruir com fundação sólida.

---

## 3. Objetivos e metas de sucesso

### 3.1 Objetivos de produto

1. Ser a forma **mais rápida** de obter um arquivo bancário válido para teste — da abertura da página ao download em menos de um minuto.
2. Garantir **conformidade de leiaute**: todo arquivo gerado respeita posições, tamanhos, alinhamentos e dígitos verificadores do padrão escolhido.
3. Ser **privado por padrão**: zero persistência em servidor, aderência total à LGPD como diferencial declarado.
4. Ser **confiável como software**: cobertura de testes alta e arquitetura sustentável, viabilizando expansão de leiautes sem regressões.

### 3.2 Métricas de sucesso (KPIs)

| Métrica                                       | Meta                                                                           |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| Cobertura de testes unitários                 | **≥ 85%** (Vitest; meta herdada do roadmap do protótipo)                       |
| Fluxos críticos cobertos por E2E (Playwright) | 100% (selecionar leiaute → preencher → validar → gerar → baixar)               |
| Tempo até o primeiro arquivo gerado (TTFG)    | < 60s para um usuário novo                                                     |
| Leiautes suportados                           | 3 no lançamento (RCB001, CNAB240, CNAB400); +1 a cada release menor            |
| Taxa de arquivos válidos                      | 100% dos arquivos gerados passam em validadores de mercado (ex.: ValidaCNAB)   |
| Erros de UI reportados                        | Zero bugs conhecidos de UI no lançamento (correção dos pendentes do protótipo) |

### 3.3 Não-objetivos (Non-goals)

- **Não** é um sistema de cobrança, ERP ou gateway de pagamento.
- **Não** envia arquivos a bancos nem se conecta a internet banking.
- **Não** armazena histórico de arquivos do usuário entre sessões.
- **Não** gera boletos registrados nem se responsabiliza por uso dos arquivos em produção (são para **teste/desenvolvimento**).

---

## 4. Público-alvo e personas

### Persona 1 — A desenvolvedora de integrações ("Marina")

Back-end dev numa fintech. Está construindo o parser de retorno CNAB240 do banco X. Precisa de dezenas de arquivos com variações (ocorrências diferentes, valores, tarifas) para cobrir casos de teste. Hoje edita um `.txt` na unha. **Quer:** gerar rapidamente variações parametrizadas e baixar em lote.

### Persona 2 — O QA / tester ("Rafael")

Testa o módulo financeiro de um ERP. Não domina o leiaute a fundo, mas precisa de arquivos que "quebrem" o sistema de formas controladas (campo inválido, valor zerado, registro a mais). **Quer:** uma interface guiada que monte o arquivo certo sem ele decorar posições.

### Persona 3 — O analista de implantação ("Cláudia")

Faz onboarding de clientes que enviam arquivos de remessa. Precisa simular a remessa do cliente para homologar a importação. **Quer:** clareza visual do arquivo, validação inline e exportação confiável.

**Denominador comum:** são técnicos, trabalham muito no escuro (literal e figurado — _dark mode_), valorizam velocidade, precisão e privacidade, e desconfiam de ferramentas que pedem login ou mandam dados para servidor.

---

## 5. Proposta de valor e análise competitiva

### 5.1 Posicionamento

> **Leiautes Para Devs** — gere arquivos bancários FEBRABAN para testar seus sistemas, sem montar nada na unha e sem deixar dado em lugar nenhum.

### 5.2 Panorama competitivo

| Categoria                             | Exemplos                           | O que fazem                                                          | Lacuna que abrimos                                                                                             |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Validadores online**                | ValidaCNAB                         | Validam/visualizam arquivos existentes no navegador, com pegada LGPD | Validam, mas **não geram** massa de teste. Somos o complemento: geramos o que eles validam                     |
| **Bibliotecas de código**             | `cnab240-nodejs`, pacotes PHP/.NET | Geram arquivos via código                                            | Exigem **escrever e manter código**; sem UI; alta curva. Entregamos o mesmo resultado sem programar            |
| **ERPs / financeiros**                | Omie, Nibo, ERPFlex                | Geram remessa/retorno dentro de um produto maior, com dados reais    | Pesados, pagos, voltados ao **negócio** e a dados de produção — não ao **dev** que quer massa de teste isolada |
| **Geradores de leiaute corporativos** | Radar (WK)                         | Configuram leiautes dentro de suítes empresariais                    | Ferramenta interna de ERP, não autônoma nem dev-friendly                                                       |

### 5.3 Diferenciais defensáveis

1. **Foco no dev/tester**, não no financeiro — linguagem, fluxo e features pensados para teste de sistemas.
2. **Geração (não só validação)** de arquivos válidos e parametrizáveis.
3. **Privacidade por arquitetura** (client-side, Pinia, zero persistência) como promessa de marca, não rodapé.
4. **Sem instalação, sem código, sem login** — abre e usa.
5. **Identidade própria e memorável** (café + terminal) num mercado de ferramentas cinzas e genéricas.

---

## 6. Escopo

### 6.1 Dentro do escopo (MVP / v2.0)

- Geração de **RCB001** (paridade com o protótipo, reescrita e testada).
- Geração de **CNAB240** e **CNAB400** (remessa e retorno).
- Interface componentizada para montagem de header, lotes, registros-detalhe e trailers.
- Validação inline de campos via atributo `rules` do Quasar (tipo, tamanho, obrigatoriedade, dígitos verificadores), **com botão global para habilitar/desabilitar a validação**.
- Visualizador monoespaçado do arquivo com régua de posições.
- Exportação: download `.txt`/`.rem`/`.ret` e "copiar para a área de transferência".
- Dark mode e light mode.
- Interface fixa em **PT-BR**, voltada ao público brasileiro (sem i18n / multi-idioma).

### 6.2 Fora do escopo (agora)

- Envio de arquivos a bancos / internet banking.
- Persistência entre sessões, contas de usuário, histórico em nuvem.
- Geração de boletos registrados ou QR Code Pix de produção.
- **Internacionalização (i18n) / multi-idioma** — o produto é PT-BR por decisão de público.
- Leiautes proprietários de bancos específicos além do padrão FEBRABAN (avaliar por demanda).

---

## 7. Requisitos funcionais

> Notação: **[RF-n]**. Prioridade em MoSCoW (Must / Should / Could / Won't).

### 7.1 Seleção e configuração de leiaute

- **[RF-01] (Must)** O usuário pode escolher o leiaute (RCB001, CNAB240, CNAB400) e o tipo (remessa/retorno) em um seletor claro.
- **[RF-02] (Must)** Ao trocar de leiaute, o formulário se reconfigura para os campos do padrão escolhido, sem recarregar a página.
- **[RF-03] (Should)** Campos comuns (empresa, banco, conta) são preservados ao alternar leiautes compatíveis.

### 7.2 Montagem do arquivo

- **[RF-04] (Must)** O usuário preenche header de arquivo, header de lote, registros-detalhe e trailers por meio de formulários guiados.
- **[RF-05] (Must)** É possível **adicionar, editar, duplicar e remover** registros-detalhe dinamicamente.
- **[RF-06] (Must)** Cada registro-detalhe abre/fecha de forma confiável (corrige o bug de abrir/fechar do protótipo).
- **[RF-07] (Should)** Campos calculados (sequenciais, totais, quantidade de registros, dígitos verificadores) são preenchidos automaticamente.
- **[RF-08] (Could)** Geração de **massa em lote**: criar N registros-detalhe a partir de um modelo, com valores aleatórios ou em faixa.

### 7.3 Validação

- **[RF-09] (Must)** Validação por campo implementada via atributo `rules` do Quasar: tipo (numérico/alfanumérico), tamanho exato, obrigatoriedade, alinhamento, preenchimento (zeros/espaços) e dígitos verificadores.
- **[RF-10] (Must)** **Botão global de habilitar/desabilitar a validação por campo.** Com a validação **ligada** (padrão), as `rules` do Quasar impedem a geração de arquivos inválidos — atende **Marina** e **Cláudia**, que precisam de arquivos confiáveis. Com a validação **desligada**, o usuário pode **forçar erros propositais** (campo fora do tamanho, valor inválido, registro a mais) — atende **Rafael**, que precisa testar como o sistema-alvo reage a arquivos malformados. O estado é visível na UI (ex.: badge "validação: on/off").
- **[RF-11] (Must)** Correção dos campos **Valor Recebido** e **Valor da Tarifa** (bugs herdados do protótipo).
- **[RF-12] (Should)** Resumo de validação do arquivo inteiro: contagem de erros/avisos e navegação até o campo problemático (respeita o estado on/off de **[RF-10]**).

### 7.4 Visualização e exportação

- **[RF-13] (Must)** Visualizador monoespaçado do arquivo gerado, com numeração de linhas e **régua de posições** (1…240 / 1…400).
- **[RF-14] (Should)** Destaque do campo: ao focar um campo do formulário, o trecho correspondente acende no visualizador.
- **[RF-15] (Must)** Botão **Baixar arquivo** com extensão adequada e botão **Copiar conteúdo**.
- **[RF-16] (Could)** Exportar a **configuração** do arquivo (não os dados sensíveis) como JSON para recriar um cenário de teste depois — opt-in explícito.

### 7.5 Preferências

- **[RF-17] (Must)** Alternância **dark/light mode** (e o easter egg de origem: "Darkmode... por sua culpa, Erick!").

> A interface não possui seletor de idioma: é **exclusivamente PT-BR** (ver **[RNF-10]**).

---

## 8. Requisitos não-funcionais

### 8.1 Privacidade e LGPD (prioridade máxima)

- **[RNF-01]** **Nenhum dado** preenchido pelo usuário é enviado a servidor ou persistido em banco de dados.
- **[RNF-02]** Todo estado vive no **Pinia**, em memória, e **não sobrevive** ao fim da sessão (fechar a aba/atualizar limpa os dados).
- **[RNF-03]** A promessa de privacidade é **visível e comunicada** na UI ("seus dados nunca saem do seu navegador").
- **[RNF-04]** Sem cookies de rastreamento de dados pessoais; analytics, se houver, anônimo e sem PII.

### 8.2 Qualidade, testes e convenções de código

- **[RNF-05]** Desenvolvimento orientado a **TDD**.
- **[RNF-06]** **Testes unitários com Vitest**; cobertura **≥ 85%** (meta herdada do roadmap do protótipo).
- **[RNF-07]** **Testes E2E e de componente com Playwright**, cobrindo os fluxos críticos (selecionar leiaute → preencher → validar → gerar → baixar) e os componentes-assinatura (visualizador, registro-detalhe, toggle de validação).
- **[RNF-08]** Aderência a **SOLID** e forte componentização — a lógica não vive numa única `View`.
- **[RNF-09]** **Comentários no código são incentivados.** Diferentemente da convenção de "código autoexplicativo dispensa comentários", o projeto adota, de forma deliberada, comentários explicativos em **PT-BR** para registrar intenção, regras de leiaute e decisões não óbvias. Esta diretriz prevalece sobre a leitura minimalista de comentários.
- **[RNF-10]** **Convenções de código:** identificadores (variáveis, funções, métodos) em **inglês** — ex.: `isValid`, `headerFile`, `generateFile()` — com **comentários em PT-BR**. A interface do usuário é **100% PT-BR** e **não há i18n** (decisão de público).
- **[RNF-11]** Lógica de leiaute desacoplada da UI (geradores/validadores testáveis isoladamente), permitindo adicionar leiautes sem mexer na interface.

### 8.3 Performance e acessibilidade

- **[RNF-12]** Geração e renderização de arquivos com milhares de linhas sem travar a UI.
- **[RNF-13]** Acessibilidade **WCAG 2.1 AA**: contraste validado, navegação por teclado, alvos de toque ≥ 44px no mobile, respeito a `prefers-reduced-motion`.
- **[RNF-14]** Responsivo (desktop-first, mas utilizável no mobile/tablet).

### 8.4 Plataforma

- **[RNF-15]** Quasar.js + Vite + Vue 3 + TypeScript; deploy estático (ex.: Netlify), sem backend obrigatório.

---

## 9. Arquitetura técnica (visão de produto)

```
┌──────────────────────────────────────────────┐
│  UI (Quasar + Vue 3 + TS)                      │
│  Componentes: Seletor, Formulários, Detalhes,  │
│  Visualizador monoespaçado, Validação inline   │
└───────────────┬────────────────────────────────┘
                │ (estado reativo, somente em memória)
┌───────────────▼────────────────────────────────┐
│  Estado (Pinia) — sessão apenas, sem persistência│
└───────────────┬────────────────────────────────┘
                │ (chamadas a serviços puros, testáveis)
┌───────────────▼────────────────────────────────┐
│  Núcleo de leiautes (TS puro, sem dependência   │
│  de UI): geradores, validadores, dígitos        │
│  verificadores, formatação de posições          │
│  RCB001 · CNAB240 · CNAB400 (Strategy por leiaute)│
└─────────────────────────────────────────────────┘
```

Decisões-chave: o **núcleo de leiautes é TypeScript puro**, isolado da UI e coberto por testes; cada leiaute é uma estratégia plugável; o estado é efêmero por design (LGPD). Não há camada de banco de dados.

---

## 10. Roadmap por versões

Mantendo a narrativa de origem — o _Patinho Feio_ virando cisne — e o tema café.

### v1.0.0 — "Patinho Feio" _(concluído, protótipo)_

Prova de conceito em Vue/Vuetify. Apenas RCB001. Baixa cobertura, sem SOLID, UI monolítica.

### v2.0.0 — "Cisne" _(este PRD — fundação)_

Reescrita em Quasar + TS sob TDD, com **testes Vitest (unitários) e Playwright (E2E e de componente)**. RCB001 reescrito e testado, CNAB240 e CNAB400, componentização total, correção de bugs do protótipo, dark mode, **botão de habilitar/desabilitar validação**, interface **100% PT-BR (sem i18n)**, identidade de marca "café + console". Meta de cobertura ≥ 85%.

### v2.x — "Mais um café"

Geração de massa em lote (RF-08), destaque de campo no visualizador (RF-14), exportar/importar configuração de cenário (RF-16), novos leiautes FEBRABAN sob demanda.

### Futuro (em avaliação)

Leiautes específicos por banco; modo "diff" entre arquivos; presets de cenários de teste compartilháveis (sem dados sensíveis).

---

## 11. Marca e tom de voz

- **Assinatura de origem:** o produto é "movido a café extra-forte" — e isso aparece de forma explícita no produto, no README e em arquivos públicos (requisito do dono do produto).
- **Personalidade:** técnico, direto e bem-humorado de dev (o easter egg do dark mode "por culpa do Erick" é canônico e deve ser preservado).
- **Tom:** fala de igual para igual com quem programa; sem jargão de marketing vazio; valoriza precisão, velocidade e privacidade.
- A identidade visual completa (paleta café/terminal, tipografia, componentes) está no documento **Design System — Leiautes Para Devs**.

---

## 12. Riscos, premissas e dependências

| #   | Tipo         | Descrição                                                                         | Mitigação                                                                            |
| --- | ------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| R1  | Técnico      | Diferenças de implementação do leiaute entre bancos sobre o mesmo padrão FEBRABAN | Tratar variações como extensões da estratégia base; documentar premissas por leiaute |
| R2  | Conformidade | Usuário inserir dados reais sensíveis                                             | Reforçar mensagem de privacidade; estado efêmero por design; nunca persistir         |
| R3  | Produto      | Escopo inflar para "fazer tudo de banco"                                          | Manter non-goals firmes; foco em geração para teste                                  |
| R4  | Qualidade    | Meta de 85% de cobertura pressionar o cronograma                                  | TDD desde o início; núcleo desacoplado facilita testes                               |
| P1  | Premissa     | Especificações dos leiautes RCB001/CNAB240/CNAB400 disponíveis e estáveis         | —                                                                                    |
| P2  | Premissa     | Público aceita ferramenta client-side sem login                                   | Validado pelo sucesso de ferramentas como ValidaCNAB                                 |

---

## 13. Critérios de aceite do produto (alto nível)

- [ ] Gera RCB001, CNAB240 e CNAB400 válidos, aprovados por validador de mercado.
- [ ] Nenhum dado é enviado a servidor nem persiste após o fim da sessão.
- [ ] Bugs do protótipo (Valor Recebido, Valor da Tarifa, abrir/fechar de registro) corrigidos.
- [ ] Botão de habilitar/desabilitar validação por campo funcionando: gera arquivo confiável com a validação ligada e permite forçar erros com ela desligada.
- [ ] Cobertura de testes unitários (Vitest) ≥ 85% e fluxos críticos cobertos por E2E (Playwright).
- [ ] Dark/light mode funcional; interface **100% em PT-BR** (sem i18n).
- [ ] Código com identificadores em **inglês** e comentários em **PT-BR**, com comentários explicativos presentes nas regras de leiaute.
- [ ] Acessibilidade WCAG 2.1 AA atendida nos fluxos principais.
- [ ] Marca "café extra-forte" presente no produto e no README.

---

_Documento vivo — sujeito a refinamento iterativo com a evolução do produto._
