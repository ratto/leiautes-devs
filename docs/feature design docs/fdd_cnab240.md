### FDD: Correção Estrutural e Semântica do Motor CNAB240

Versão: 1.0.0
Data: 2026-07-04
Responsável: Desenvolvedor Principal

---

### 1. Contexto e motivação técnica
A feature atualiza a estratégia `cnab240.ts` no ecossistema do `leiautes-devs` para garantir conformidade estrita com o leiaute FEBRABAN. Ela resolve problemas críticos de perda de dados em arquivos de retorno (ausência de motivos de rejeição/liquidação) e corrige a estrutura de campos em arquivos de remessa. Os atores principais são o sistema gerador e leitor de arquivos, o módulo `generator.ts` e as instituições bancárias validadoras.

---

### 2. Objetivos técnicos
- Corrigir 100% dos parâmetros e validações da estratégia `cnab240.ts`, eliminando todas as inconsistências bloqueantes, relevantes e cosméticas apontadas na auditoria.
- Garantir que o motor de geração e leitura mantenha a tipagem correta, aplicando o preenchimento (padding) adequado de espaços ou zeros, e respeite as posições exatas exigidas pela FEBRABAN de forma determinística.

---

### 3. Escopo e exclusões

**Incluído**
- Correção completa de todos os campos mapeados nos Segmentos P, Q, T, U, Headers e Trailers.
- Ajuste no módulo `generator.ts` para preencher lacunas de campos numéricos ausentes com zeros à esquerda em vez de espaços.
- Atualização de todas as camadas dependentes (composables, componentes de UI e testes) para refletir as novas assinaturas.

**Excluído**
- Implementação de carteiras adicionais como Vinculada, Caucionada e Descontada.
- Implementação de funcionalidades de Banco Correspondente e Nome do Sacador/Avalista.
- Cálculo e validação automática de Dígitos Verificadores (DV), mantendo o comportamento de texto livre suportado pela especificação.

---

### 4. Fluxos detalhados e diagramas
**Fluxo principal**
- Remessa (Geração): O sistema recebe o payload estruturado; a estratégia mapeia os dados para as posições exatas dos registros tipo 0, 1, 3(P, Q), 5 e 9. O `generator.ts` aplica o padding correto (zeros à esquerda para numéricos, espaços à direita para alfanuméricos).
- Retorno (Leitura): O sistema recebe a string do arquivo, quebra em linhas, identifica o tipo de registro, extrai as substrings por índice exato e valida as totalizações do Trailer (registro 5).

**Fluxos alternativos e exceções**
- Geração com Erros Intencionais: O usuário pode desabilitar as validações da biblioteca para gerar propositalmente arquivos corrompidos e testar casos extremos em seus sistemas receptores.
- Interrupção de Leitura: Falhas estruturais críticas no parse do arquivo lançam um erro, interrompendo a leitura para evitar a propagação de dados corrompidos.

---

### 5. Contratos públicos (assinaturas, endpoints, headers, exemplos)
**Contratos Typescript**
- Tipo: sdk
- Assinatura/Rota: Interfaces `Cnab240Payload` e `Cnab240ParsedResult`
- Método: Local
- Semântica de status/headers:
  - payload_size_limit — Arquivos devem respeitar a quebra estrita de 240 caracteres por linha.
  - types — Atualização em cascata nos campos de Ocorrência do Pagador (Segmento U) e Motivo da Ocorrência (Segmento T).

**Exemplo de requisição**
```json
{
  "operation": "generate",
  "ignoreValidation": true,
  "payload": {
    "header": { "bankCode": "341" }
  }
}
```

**Exemplo de resposta**
```json
{
  "status": "success",
  "fileString": "0341...",
  "warnings": [
    { "field": "payerName", "error": "length_exceeded" }
  ]
}
```

---

### 6. Erros, exceções e fallback
**Matriz de erros previstos e tratamentos**
- Condição: Dados inválidos na geração. Tratamento: Delegado ao usuário, não emite exceção bloqueante se a flag de bypass estiver ativa.
- Condição: Falha estrutural no arquivo de retorno lido. Tratamento: Emissão de erro estruturado indicando linha e falha.
- Condição: Campo não encontrado no parse. Tratamento: Retorno de valor `undefined` ou nulo.

**Estratégias de resiliência:** Síncrono e local (timeouts, retries, circuit breaker não aplicáveis)
**Política de fallback:** Fallback para `undefined` em chaves ausentes.
**Invariantes:** Comprimento estrito de 240 caracteres; padding estrito baseado no tipo do campo.

---

### 7. Observabilidade
**Métricas**
- N/A (Métricas ativas delegadas à aplicação consumidora).

**Logs**
- N/A.

**Tracing**
- N/A.

**Dashboards e alertas**
- Motor de geração alimenta continuamente o componente de UI existente com dados estruturados de validação e warnings sobre quebras de leiaute.

---

### 8. Dependências e compatibilidade

| Componente | Versão mínima | Observações |
| :--- | :--- | :--- |
| `Node/TypeScript` | Atual do repo | Nenhuma dependência externa será adicionada. |

**Garantias de compatibilidade**
- Breaking Change Interna: A alteração causará quebra de contrato. Composables e UI deverão ser refatorados para ler/enviar a nova estrutura de propriedades.
- Retrocompatibilidade de Arquivos: Arquivos gerados pelo motor atualizado não serão idênticos (byte a byte) aos das versões anteriores devido à correção do preenchimento numérico (zeros em vez de espaços).

---

### 9. Critérios de aceite técnicos
- O parse de arquivos de retorno extrai com precisão o "Motivo da Ocorrência" no Segmento T e o bloco completo de "Ocorrência do Pagador" no Segmento U, comprovado por testes de unidade.
- A geração de remessas e retornos assegura 240 posições exatas por linha, preenchendo lacunas de campos numéricos com zeros à esquerda e alfanuméricos com espaços.
- O componente visual exibe corretamente os erros de validação baseados na especificação atualizada e permite exportar arquivos mal formatados caso o usuário ative a opção.

---

### 10. Riscos e mitigação
**Risco de Regressão Estrutural**
Probabilidade: média
Impacto: Corromper leiautes compartilhados ao alterar o comportamento global do `generator.ts` de preenchimento.
Mitigação:
- Garantir que as zonas de "Uso Exclusivo" continuem declaradas como `alfa` para receber espaços corretamente.
- Adicionar testes de regressão gerando um arquivo completo e validando as posições caractere a caractere.
Plano de contingência: Reverter o PR do `generator.ts` e isolar o comportamento de padding via herança exclusiva para a estratégia CNAB240.

**Risco de Quebra de Integração**
Probabilidade: alta
Impacto: Componentes de UI não compilarem ou apresentarem erros de runtime por mudanças nas interfaces.
Mitigação:
- Praticar Type-Driven Development, atualizando primeiro as definições e corrigindo os erros do compilador no projeto inteiro.
Plano de contingência: Ajustar as interfaces legadas como opcionais temporariamente e realizar a transição da UI em duas etapas.
