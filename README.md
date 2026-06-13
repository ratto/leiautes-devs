# ☕ Leiautes Para Devs

> Gere arquivos bancários homologados pela FEBRABAN para **testar seus sistemas** — sem montar nada na unha, sem login e sem deixar dado em lugar nenhum.
>
> Feito por dev, para dev. E movido a café extra-forte.

[![feito com](https://img.shields.io/badge/feito%20com-caf%C3%A9%20extra--forte-6F4E2E)](#-apoie-este-projeto)
[![PT-BR](https://img.shields.io/badge/idioma-PT--BR-F2A03D)](#)
[![LGPD](https://img.shields.io/badge/privacidade-client--side%20%C2%B7%20LGPD-5FBF8F)](#-privacidade-em-primeiro-lugar)
[![licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](#-licença)

Use online, sem instalar nada: **[leiautes-para-devs.netlify.app](https://leiautes-para-devs.netlify.app/)**

---

## 🧐 Por que este projeto existe?

Quem desenvolve ou testa integração bancária conhece o gargalo: para validar o parsing, a importação ou o processamento de um arquivo de remessa/retorno, **é preciso ter o arquivo na mão**. E conseguir um costuma significar montar strings de 240/400 posições contando caractere por caractere, depender do banco para "cuspir" um arquivo real (com dados sensíveis de clientes) ou escrever uma lib só para gerar massa de teste.

O **Leiautes Para Devs** resolve isso: você monta o arquivo numa interface guiada e baixa um arquivo válido em segundos — pronto para alimentar seus testes.

> Este projeto é a evolução do protótipo [`arquivo-bancario-generator`](https://github.com/ratto/arquivo-bancario-generator) (codinome *Patinho Feio*). O patinho virou cisne: reescrito em Quasar + TypeScript, sob TDD, com arquitetura sustentável.

---

## ✨ Principais recursos

- **Geração de arquivos** nos leiautes **RCB001**, **CNAB240** e **CNAB400** (remessa e retorno).
- **Validação que liga e desliga.** Com a validação **ligada** (padrão), o app impede arquivos inválidos — confiável para quem precisa de massa correta. **Desligada**, você pode **forçar erros de propósito** — perfeita para QA testar como o sistema-alvo reage a arquivos malformados.
- **Visualizador monoespaçado** do arquivo, com numeração de linhas e **régua de posições** (1…240 / 1…400).
- **Privacidade por arquitetura:** nada é enviado a servidor nem persistido. Seus dados vivem só na sessão (Pinia, em memória) — aderência total à **LGPD**.
- **Exportação:** baixe o arquivo ou copie o conteúdo para a área de transferência.
- **Dark mode** e light mode... por sua culpa, Erick! XD

---

## 🔒 Privacidade em primeiro lugar

O Leiautes Para Devs roda **inteiramente no seu navegador**. Não há backend de persistência, não há banco de dados, não há conta de usuário. Todo o estado vive no **Pinia**, em memória, e **não sobrevive ao fim da sessão** — fechar a aba ou atualizar a página limpa tudo.

Isso é uma decisão de arquitetura, não um rodapé: você pode preencher dados de teste tranquilo, porque eles nunca saem da sua máquina.

---

## 🚀 Tecnologias utilizadas

### Front-end

- **[Quasar](https://quasar.dev/) (Vue 3):** framework de UI sobre Vue 3, com componentes ricos e build otimizado.
- **[Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/):** interfaces reativas com tipagem estática.
- **[Pinia](https://pinia.vuejs.org/):** estado em memória, sem persistência (por design).

### Ferramentas de desenvolvimento

- **[Vite](https://vitejs.dev/):** ambiente de desenvolvimento e build rápidos.
- **[Vitest](https://vitest.dev/):** testes **unitários**, com meta de cobertura **≥ 85%**.
- **[Playwright](https://playwright.dev/):** testes **E2E** e **de componente** dos fluxos críticos.
- **[ESLint](https://eslint.org/) + [Prettier](https://prettier.io/):** padronização e formatação.

---

## 🧱 Convenções de código

- **Idioma da interface:** exclusivamente **PT-BR** (sem i18n) — voltado ao desenvolvedor brasileiro ou a quem lida com bancos brasileiros.
- **Nomenclatura do código:** identificadores em **inglês** — ex.: `isValid`, `headerFile`, `generateFile()`.
- **Comentários:** em **português-brasileiro**, e **incentivados**. Aqui, comentar bem o porquê das regras de leiaute e das decisões não óbvias é prática desejada, não "code smell".
- **Arquitetura:** o núcleo de leiautes é TypeScript puro, desacoplado da UI e coberto por testes — cada leiaute é uma estratégia plugável.

---

## 🛠️ Instalação e uso

### Pré-requisitos

**Node.js** (versão LTS recomendada) instalado na sua máquina.

### Clonando o repositório

```bash
git clone https://github.com/ratto/leiautes-para-devs.git
cd leiautes-para-devs
```

### Instalando dependências

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
quasar dev
```

### Build para produção

```bash
quasar build
```

### Testes

```bash
# unitários (Vitest)
npm run test:unit

# cobertura
npm run test:unit:coverage

# E2E e de componente (Playwright)
npm run test:e2e
```

---

## 📂 Estrutura do projeto

- **src/**
  - **core/leiautes/** — núcleo em TS puro: geradores, validadores, dígitos verificadores e formatação posicional (RCB001 · CNAB240 · CNAB400).
  - **components/** — componentes Vue reutilizáveis (visualizador, registro-detalhe, seletor de leiaute, toggle de validação…).
  - **pages/** — páginas da aplicação.
  - **layouts/** — layouts do Quasar.
  - **stores/** — estado Pinia (em memória, somente sessão).
  - **composables/** — lógica reutilizável de UI.
- **test/** — testes unitários (Vitest).
- **test/e2e/** — testes E2E e de componente (Playwright).

---

## 🗺️ Roadmap

- **v1.0.0 — "Patinho Feio"** *(protótipo, concluído):* prova de conceito em Vue/Vuetify, apenas RCB001.
- **v2.0.0 — "Cisne"** *(atual):* reescrita em Quasar + TS sob TDD; RCB001, CNAB240 e CNAB400; toggle de validação; visualizador com régua de posições; dark mode; testes Vitest + Playwright; cobertura ≥ 85%.
- **v2.x — "Mais um café":** geração de massa em lote, destaque de campo no visualizador, exportar/importar cenários de teste, novos leiautes FEBRABAN sob demanda.

---

## 🤝 Contribuindo

1. Faça um fork do repositório.
2. Crie uma branch: `git checkout -b minha-feature`.
3. Commite suas alterações: `git commit -m 'Adiciona nova funcionalidade'`.
4. Envie para o seu fork: `git push origin minha-feature`.
5. Abra um Pull Request.

Identificadores em inglês, comentários em PT-BR, e testes para o que você tocar. ☕

---

## 📝 Licença

Licenciado sob a **MIT License**.

---

## 📧 Contato

Dúvidas ou sugestões? Fale comigo pelo [LinkedIn](https://www.linkedin.com/in/pedro-tosta-paixao/), [Facebook](https://www.facebook.com/rattopedro/) ou abra uma issue neste repositório.

---

## ❤️ Apoie este projeto

Este projeto foi criado com dedicação (e muito café) para ajudar profissionais a economizar tempo e evitar frustrações com arquivos bancários. Se ele é útil pra você, considere apoiar:

- Manter e melhorar a aplicação com novos recursos e leiautes.
- Garantir suporte contínuo e atualizações.
- Comprar mais café extra-forte para codificar mais ferramentas úteis. ☕

[![Doe pelo PayPal](https://img.shields.io/badge/PayPal-Donate-blue.svg)](https://www.paypal.com/donate/?hosted_button_id=8RE442ASFC2PS)

Mesmo sem poder doar, compartilhar o projeto com colegas já faz uma enorme diferença. Obrigadão! 🙌
