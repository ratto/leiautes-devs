# Design System — Leiautes Para Devs

> **"Café + Console"** — a identidade visual de uma ferramenta de dev, movida a café extra-forte.
> Pronto para uso na ferramenta de Design (Claude Design / Figma): tokens, paleta, tipografia e componentes especificados.

| | |
|---|---|
| **Versão** | 1.0 |
| **Produto** | Leiautes Para Devs |
| **Tema base** | Dark-first (com light mode completo) |
| **Stack-alvo** | Quasar + Vue 3, mas tokens agnósticos (CSS variables) |
| **Acessibilidade** | WCAG 2.1 AA (todos os pares de cor validados) |

---

## 1. Conceito de marca

Os arquivos CNAB/RCB são **registros posicionais de largura fixa** — cada caractere tem uma posição obrigatória. Isso torna a fonte monoespaçada uma **necessidade funcional**, não um enfeite. Daí o conceito: **terminal/console** encontra **café**.

A estética de 2026 para ferramentas técnicas reforça esse caminho — *function-forward design*: tipografia mono para dados, grids como elemento visual, dark mode como expectativa do público dev, e privacidade como valor de marca. A paleta traduz tudo isso na linguagem do café: torra escura, crema, âmbar de caramelo.

**Princípios de design**
1. **Função primeiro.** A clareza do dado vence a decoração.
2. **Escuro por padrão.** Conforto para quem passa o dia no editor.
3. **Mono onde importa.** Posições, valores e o arquivo em si sempre monoespaçados.
4. **Privado e honesto.** A UI comunica que o dado não sai do navegador.
5. **Calor humano (e cafeinado).** Técnico sem ser frio; cinza nunca, café sempre.

---

## 2. Paleta de cores

Inspiração: torra de café (fundos), crema/espuma (texto), âmbar de caramelo (ação). Todos os pares texto/fundo abaixo passam em **WCAG AA** (contraste ≥ 4.5:1).

### 2.1 Tema escuro (padrão)

| Token | Hex | Nome | Uso |
|---|---|---|---|
| `--lpd-base` | `#14100B` | Café Preto | Fundo da página |
| `--lpd-surface` | `#1F1813` | Espresso | Cards, painéis |
| `--lpd-surface-2` | `#2A211A` | Torra Média | Superfícies elevadas, hover de linha |
| `--lpd-border` | `#3A2E24` | Borra | Bordas, divisores |
| `--lpd-text` | `#F5E9D6` | Crema | Texto primário *(15.8:1)* |
| `--lpd-text-muted` | `#B6A28C` | Leite Vaporizado | Texto secundário *(7.7:1)* |
| `--lpd-accent` | `#F2A03D` | Âmbar / Caramelo | Ação primária, links, destaque *(8.9:1)* |
| `--lpd-accent-hover` | `#FFB454` | Âmbar Claro | Hover do acento |
| `--lpd-on-accent` | `#1A1109` | Grão | Texto sobre botão âmbar *(8.75:1)* |

### 2.2 Tema claro (light mode)

| Token | Hex | Nome | Uso |
|---|---|---|---|
| `--lpd-base` | `#FBF6EE` | Espuma | Fundo da página |
| `--lpd-surface` | `#FFFFFF` | Porcelana | Cards, painéis |
| `--lpd-border` | `#E4D8C6` | Aro da Xícara | Bordas, divisores |
| `--lpd-text` | `#2B1D14` | Café Forte | Texto primário *(15.2:1)* |
| `--lpd-text-muted` | `#6E5B47` | Café com Leite | Texto secundário *(6.0:1)* |
| `--lpd-accent` | `#A35413` | Âmbar Torrado | Links/ação em texto sobre claro *(5.1:1)* |
| `--lpd-accent-solid` | `#F2A03D` | Âmbar | Fundo de botão (com texto escuro, 7.7:1) |
| `--lpd-on-accent` | `#FFFFFF` / `#2B1D14` | — | Texto sobre botão âmbar |

### 2.3 Cores de feedback (mesmas em ambos os temas, ajustar luminosidade por contexto)

| Token | Hex (dark) | Uso |
|---|---|---|
| `--lpd-success` | `#5FBF8F` | Campo válido, sucesso *(8.4:1)* |
| `--lpd-error` | `#F26D6D` | Erro de validação *(6.5:1)* |
| `--lpd-warning` | `#F2C94C` | Aviso (usar com parcimônia: não competir com o âmbar) |
| `--lpd-info` | `#6DA8F2` | Informação, dicas *(7.7:1)* |

### 2.4 CSS Variables (prontas)

```css
:root[data-theme="dark"] {
  --lpd-base: #14100B;
  --lpd-surface: #1F1813;
  --lpd-surface-2: #2A211A;
  --lpd-border: #3A2E24;
  --lpd-text: #F5E9D6;
  --lpd-text-muted: #B6A28C;
  --lpd-accent: #F2A03D;
  --lpd-accent-hover: #FFB454;
  --lpd-on-accent: #1A1109;
  --lpd-success: #5FBF8F;
  --lpd-error: #F26D6D;
  --lpd-warning: #F2C94C;
  --lpd-info: #6DA8F2;
}
:root[data-theme="light"] {
  --lpd-base: #FBF6EE;
  --lpd-surface: #FFFFFF;
  --lpd-surface-2: #F4ECDF;
  --lpd-border: #E4D8C6;
  --lpd-text: #2B1D14;
  --lpd-text-muted: #6E5B47;
  --lpd-accent: #A35413;
  --lpd-accent-hover: #C06A12;
  --lpd-on-accent: #FFFFFF;
  --lpd-success: #2E8B5C;
  --lpd-error: #C0392B;
  --lpd-warning: #B7860B;
  --lpd-info: #2E6FB0;
}
```

---

## 3. Tipografia

Três famílias, todas **Google Fonts gratuitas**, cada uma com um papel funcional.

| Papel | Fonte | Por quê |
|---|---|---|
| **Display / títulos** | **Space Grotesk** | Sans técnica com personalidade; padrão de ferramentas dev/SaaS 2026 |
| **Corpo / UI** | **Inter** | Workhorse legível em qualquer tamanho; ótima em densidade de UI |
| **Mono / dados** | **JetBrains Mono** | Estética de terminal; **obrigatória** para o arquivo, posições e valores |

```css
--lpd-font-display: 'Space Grotesk', system-ui, sans-serif;
--lpd-font-body: 'Inter', system-ui, sans-serif;
--lpd-font-mono: 'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace;
```

### 3.1 Escala tipográfica

| Token | Tamanho / Altura | Fonte / Peso | Uso |
|---|---|---|---|
| `display` | 48 / 56px | Space Grotesk 700 | Hero da landing |
| `h1` | 32 / 40px | Space Grotesk 700 | Título de página |
| `h2` | 24 / 32px | Space Grotesk 600 | Seções |
| `h3` | 20 / 28px | Space Grotesk 600 | Subseções, cards |
| `body-lg` | 18 / 28px | Inter 400 | Texto introdutório |
| `body` | 16 / 24px | Inter 400 | Padrão da UI |
| `body-sm` | 14 / 20px | Inter 400 | Labels, ajudas |
| `caption` | 12 / 16px | Inter 500 | Metadados, hints |
| `mono` | 14 / 22px | JetBrains Mono 400 | Conteúdo do arquivo, valores |
| `mono-sm` | 12 / 20px | JetBrains Mono 400 | Régua de posições |

> Mobile: reduzir `display`→32px e `h1`→26px. Manter mono em 14px para não quebrar o alinhamento posicional.

---

## 4. Tokens de layout

### 4.1 Espaçamento (base 8px)
`--lpd-space-1: 4px` · `2: 8px` · `3: 12px` · `4: 16px` · `5: 24px` · `6: 32px` · `7: 48px` · `8: 64px`

### 4.2 Raio de borda
`--lpd-radius-sm: 6px` (inputs, badges) · `md: 10px` (botões, cards) · `lg: 16px` (modais, painéis) · `full: 999px` (chips, toggles)

### 4.3 Sombras (sutis no dark; o "lift" vem da superfície mais clara)
```css
--lpd-shadow-sm: 0 1px 2px rgba(0,0,0,.35);
--lpd-shadow-md: 0 4px 12px rgba(0,0,0,.40);
--lpd-shadow-lg: 0 12px 32px rgba(0,0,0,.50);
```

### 4.4 Grid e largura
- Conteúdo máx.: **1280px**; landing pode chegar a 1440px.
- Layout do app: duas colunas em desktop — **formulário (esquerda) + visualizador do arquivo (direita)**.
- Mobile-first responsivo; colunas viram abas/stack no mobile.

### 4.5 Movimento
- Transições rápidas: **150–250ms**, `ease-out`.
- Micro-interações (foco de campo → destaque no arquivo): ≤ 300ms.
- Respeitar `prefers-reduced-motion`.

---

## 5. Componentes

Estados sempre: **normal · hover · focus · active · disabled · erro** (quando aplicável). Alvos de toque ≥ 44px no mobile.

### 5.1 Botões
| Variante | Aparência |
|---|---|
| **Primário** | Fundo `--lpd-accent`, texto `--lpd-on-accent`, radius md, 44px de altura. Hover → `--lpd-accent-hover`. |
| **Secundário** | Fundo transparente, borda `--lpd-border`, texto `--lpd-text`. Hover → fundo `--lpd-surface-2`. |
| **Fantasma** | Sem borda, só texto/ícone âmbar. Para ações terciárias. |
| **Perigo** | Texto/borda `--lpd-error`; usar em remover registro. |
| Foco | Anel de 2px `--lpd-accent` com offset (visível no teclado). |

### 5.2 Inputs e formulário
- Altura 44px; fundo `--lpd-surface`; borda `--lpd-border`; radius sm.
- Label `body-sm` acima; hint `caption` abaixo.
- **Foco:** borda `--lpd-accent` + anel suave.
- **Erro:** borda `--lpd-error` + mensagem `caption` em `--lpd-error`.
- **Campos posicionais** (valores, contas): usam `--lpd-font-mono` para alinhar dígitos.
- Validação inline reflete tipo/tamanho/obrigatoriedade do leiaute.

### 5.3 Card de registro-detalhe (componente assinatura)
- Card `--lpd-surface`, borda `--lpd-border`, radius md.
- Cabeçalho clicável com **chevron** que abre/fecha de forma confiável (corrige o bug do protótipo) + badge de status.
- Ações no canto: **duplicar**, **remover** (perigo).
- Ao expandir: grade de campos do registro.

### 5.4 Seletor de leiaute
- Conjunto de **chips/abas**: `RCB001` · `CNAB240` · `CNAB400`, com um toggle remessa/retorno.
- Selecionado: fundo `--lpd-accent`, texto `--lpd-on-accent`. Demais: `--lpd-surface-2`.

### 5.5 Visualizador de arquivo (componente assinatura)
- Painel `--lpd-base` (efeito "terminal"), texto `--lpd-font-mono`.
- **Régua de posições** no topo (1…240 / 1…400) em `mono-sm`, `--lpd-text-muted`.
- Numeração de linhas à esquerda.
- **Destaque de campo**: ao focar um campo no formulário, o trecho correspondente acende em `--lpd-accent` com leve fundo.
- Barra de ações: **Copiar** e **Baixar**.

### 5.6 Badges de status
| Estado | Cor | Texto |
|---|---|---|
| Válido | `--lpd-success` | "válido" |
| Erro | `--lpd-error` | "erro" |
| Aviso | `--lpd-warning` | "aviso" |
Pílula radius full, `caption`, com ponto colorido à esquerda.

### 5.7 Toggle de tema (dark/light)
- Switch radius full com ícone sol/lua.
- Easter egg de marca: tooltip "Darkmode... por sua culpa, Erick! 😄".

### 5.8 Selo de privacidade (LGPD)
- Banner/badge discreto e persistente: ícone de cadeado + "Seus dados nunca saem do seu navegador".
- Fundo `--lpd-surface-2`, texto `--lpd-text-muted`, acento `--lpd-info`.

### 5.9 Toasts / notificações
- Canto inferior; fundo `--lpd-surface`, borda lateral 3px na cor do feedback.
- Auto-dismiss 4s; pausável no hover.

---

## 6. Iconografia e ilustração
- **Ícones:** linha, 1.5–2px, cantos levemente arredondados (combinam com a curva da xícara). Conjunto sugerido: estilo *outline* coeso (ex.: Material Symbols Outlined / Lucide).
- **Motivos de marca:** grão de café, vapor, xícara minimalista, e o "prompt" do terminal (`>` / `_`). Vapor de café pode virar separador ou detalhe de loading.
- **Loading:** animação de vapor subindo de uma xícara, ou cursor de terminal piscando.
- Evitar ilustração decorativa sem função — coerente com *function-forward*.

---

## 7. Tom de voz na UI
- **Direto e técnico**, de dev para dev. Sem "marketês".
- Bom humor pontual e cafeinado (o easter egg do Erick é canônico).
- Mensagens de erro **úteis**: dizem o campo, o tamanho esperado e a posição.
- Privacidade comunicada com confiança, não com letra miúda.
- Exemplos: *"Arquivo gerado. Bom teste ☕"* · *"Campo Valor da Tarifa: esperado 10 dígitos, recebido 8."*

---

## 8. Estrutura da landing page (marketing)
1. **Hero** (dark): título em Space Grotesk, subtítulo dev-direto, CTA âmbar "Gerar meu arquivo", e um preview do visualizador monoespaçado ao lado.
2. **Problema → Solução**: o "na unha" vs. o gerado em segundos.
3. **Leiautes suportados**: chips RCB001/CNAB240/CNAB400 + "mais em breve".
4. **Privacidade em destaque**: bloco LGPD ("roda no seu navegador, nada é salvo").
5. **Para quem é**: devs, QAs, analistas de integração (as personas).
6. **CTA final** + rodapé com GitHub, contato e o selo "feito com café extra-forte ☕".

---

## 9. Como usar este Design System na ferramenta de Design

1. **Cole os tokens** da seção 2.4 (CSS variables) como estilos/variáveis do projeto.
2. **Importe as fontes** (links abaixo) e mapeie a escala da seção 3.1 em estilos de texto.
3. Crie os componentes da seção 5 como **componentes reutilizáveis**, cada um com seus estados.
4. Monte duas telas-mestre: **App (form + visualizador)** e **Landing** (seção 8), em dark e light.
5. Valide contraste e foco de teclado antes de exportar para código.

**Google Fonts**
- Space Grotesk → `https://fonts.google.com/specimen/Space+Grotesk`
- Inter → `https://fonts.google.com/specimen/Inter`
- JetBrains Mono → `https://fonts.google.com/specimen/JetBrains+Mono`

---

## 10. Checklist de acessibilidade (WCAG 2.1 AA)
- [x] Contraste de texto ≥ 4.5:1 (validado para todos os pares desta paleta).
- [ ] Foco de teclado visível em todos os interativos (anel âmbar).
- [ ] Alvos de toque ≥ 44×44px no mobile.
- [ ] `prefers-reduced-motion` respeitado.
- [ ] Mensagens de erro associadas ao campo (`aria-describedby`).
- [ ] Visualizador navegável e copiável por teclado.
- [ ] Dark/light não dependem só de cor para transmitir estado (usar ícone + texto).

---

*Documento vivo. A identidade pode evoluir, mas o café permanece extra-forte. ☕*
