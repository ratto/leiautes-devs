# HLD: Leiautes Para Devs (codinome Cisne)

Versão: 2.0.0
Data: 2026-07-04
Responsável: Pedro Paixão

---

## Objetivo técnico

Construir uma SPA puramente client-side para geração em memória de arquivos bancários, aplicando o padrão MVVM para isolar estritamente o motor de leiautes (Core) da interface visual. O sistema resolve o alto acoplamento arquitetural da versão anterior, garantindo uma base sustentável, altamente testável e pronta para escalar novos padrões bancários de forma agnóstica a framework.

Dependências com outros sistemas

- Nenhuma dependência externa ativa (sistema puramente client-side).

---

## Arquitetura geral

A topologia segue o padrão MVVM em um ambiente puramente client-side. A camada View contém os componentes visuais Vue isolados. A ViewModel atua como ponte reativa utilizando composables e Pinia. A Model (Core) encapsula a lógica de negócio, regras de formatação e validação em TypeScript puro, mantendo-se totalmente agnóstica a frameworks visuais.

Ambiente de implantação

- Cloud
- Implantação estática via CDN, servindo os artefatos de build diretamente ao navegador do usuário.

Tecnologias principais

- Vue 3 e Quasar Framework
- TypeScript e Vite
- Pinia
- Vitest e Playwright

Padrões adotados

- MVVM (Model-View-ViewModel)
- Strategy (para orquestração de variações de leiautes bancários no Core)
- Privacy by Design (estado efêmero)

---

## Componentes e responsabilidades

| Componente                          | Responsabilidades                                                                                 | Dependências                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Motor de Leiautes (Model)           | Executar validações puras, formatação, regras de negócio e aplicar o padrão Strategy.             | Nenhuma (TypeScript puro)                 |
| Composable de Validação (ViewModel) | Prover ações e estados reativos (ex: validateRcb001), orquestrando as regras do Core para a View. | Motor de Leiautes, Pinia                  |
| Store de Arquivo (ViewModel)        | Gerenciar o estado efêmero do arquivo atual e configurações globais na sessão.                    | Nenhuma                                   |
| Formulários e Visualizador (View)   | Capturar input do usuário, aplicar regras visuais e renderizar o arquivo final com virtualização. | Composable de Validação, Store de Arquivo |

---

## Fluxo de requisições e de dados

**Fluxo de requisição**

- O usuário interage com os formulários da View, alterando dados de entrada.
- A View aciona os composables da ViewModel, que aplicam máscaras e validações oriundas da Model sob demanda.
- O estado do arquivo é atualizado na Store (Pinia) refletindo as mudanças no visualizador em tempo real.
- O usuário aciona a exportação, disparando as APIs nativas do navegador para cópia ou download.

**Fluxo de dados**

- View (q-form) -> ViewModel (Composable) -> Store de Sessão (Pinia) -> Motor de Compilação (Model) -> Saída (Clipboard/Blob API)

---

## Modelo de dados (alto nível)

Entidades principais

- Arquivo (Raiz)
- Header
- Lote (HeaderLote, RegistrosDetalhe, TrailerLote)
- Trailer

Relações

- Um Arquivo contém um Header e um Trailer.
- Um Arquivo contém um ou múltiplos Lotes.
- Um Lote contém um HeaderLote, múltiplos RegistrosDetalhe e um TrailerLote.

Fonte de verdade

- Pinia (estado efêmero em memória na sessão do navegador)

---

## Interfaces públicas

| Nome             | Tipo             | Protocolo     | Exposição | SLAs/Limites                            |
| ---------------- | ---------------- | ------------- | --------- | --------------------------------------- |
| Clipboard Export | API do Navegador | Clipboard API | Externa   | p95 < 5 ms para cópia                   |
| File Export      | API do Navegador | File/Blob API | Externa   | Download instantâneo (.txt, .rem, .ret) |

---

## Considerações de escalabilidade e disponibilidade

Abordagem geral

- Foco exclusivo em performance no client-side e alta disponibilidade de entrega dos arquivos estáticos via CDN.

Técnicas aplicadas

- Virtualização de listas no componente visualizador (View) para evitar travamentos na renderização de arquivos grandes.
- Otimização da reatividade do Vue para atualizações sob demanda do estado do arquivo.

Meta de disponibilidade

- 99.9% uptime mensal para acesso à aplicação estática.

---

## Segurança

Autenticação

- Nenhuma (sistema de acesso público e aberto).

Autorização

- Nenhuma.

Proteção de dados

- Privacy by Design: zero tráfego de rede para dados preenchidos e zero persistência em banco de dados. O estado vive 100% de forma efêmera na memória do navegador.

Gestão de segredos

- Não aplicável (ausência de integrações com APIs externas ou backend).

---

## Observabilidade

Logs

- Erros de execução limitados ao console local do navegador (Developer Tools).

Métricas

- Métricas técnicas aferidas exclusivamente via pipeline de CI/CD (Vitest/Playwright). Nenhuma coleta de telemetria baseada no uso do usuário em produção.

Tracing

- Não aplicável (arquitetura sem chamadas de rede ou microserviços).

Dashboards e alertas

- Acompanhamento interno via relatórios gerados pela esteira de automação de testes.

---

## Riscos arquiteturais e mitigação

### Variações não mapeadas nos padrões FEBRABAN

- **Probabilidade:** média
- **Impacto:** geração de arquivos inválidos para determinados bancos em casos de borda.
- **Mitigação:**
  - Encapsular a lógica de cada layout usando o padrão Strategy na camada Model.
  - Facilitar a criação de subclasses para regras específicas de bancos sem afetar o core principal.
- **Plano de contingência:** desabilitar o layout ou regra com erro na View até que o patch seja aprovado na esteira de testes.

### Inserção de dados reais/sensíveis pelo usuário

- **Probabilidade:** média
- **Impacto:** vazamento não intencional de dados no ambiente local do usuário.
- **Mitigação:**
  - Arquitetura de estado efêmero (Pinia sem persistência local).
  - Avisos proeminentes na UI educando sobre boas práticas de dados de teste.
- **Plano de contingência:** não há tráfego de rede, limitando o escopo do comprometimento à própria máquina do usuário.

### Travamento da UI com arquivos pesados

- **Probabilidade:** baixa
- **Impacto:** degradação severa da experiência do usuário ao gerar milhares de registros.
- **Mitigação:**
  - Implementação de virtualização de listas no renderizador do visualizador de arquivos.
- **Plano de contingência:** limitar provisoriamente a quantidade máxima de RegistrosDetalhe criados simultaneamente na interface.

### Queda da métrica de cobertura de testes

- **Probabilidade:** baixa
- **Impacto:** quebra de confiança nas refatorações e adições de novos layouts.
- **Mitigação:**
  - Aplicação rigorosa de TDD orientando o desenvolvimento da camada Core.
- **Plano de contingência:** bloquear o merge em CI/CD caso a cobertura da camada Model fique abaixo de 85%.

---

## ADRs e próximos passos

ADRs associados

- ADR 001: Adoção do padrão MVVM para isolamento estrito do Core Domain.
- ADR 002: Adoção de estado estritamente efêmero no client-side via Pinia, visando aderência total à LGPD.

Decisões pendentes

- Padronização da estrutura final das interfaces TypeScript a serem exportadas visando integração futura com MCPs.

Próximos passos

- Setup inicial do repositório (Vite, Quasar, TypeScript).
- Configuração da esteira de testes (Vitest e Playwright).
- Estruturação inicial da camada Model.
