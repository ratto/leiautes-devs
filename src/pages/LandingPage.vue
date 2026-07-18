<script setup lang="ts">
// Landing page de marketing (design system §8): hero com preview do
// visualizador, problema → solução, features, leiautes, privacidade,
// personas e CTA final. Conteúdo 100% PT-BR, tom dev-para-dev.
import { ref } from 'vue';

/** Campo destacado no preview do terminal (hover na legenda). */
const hotField = ref<string | null>(null);

/** Demo do toggle de validação no preview do hero. */
const demoValidationOn = ref(true);

// Régua do preview como constantes: o compilador do Vue condensa espaços
// em texto de template, o que quebraria o alinhamento monoespaçado.
const rulerNumbers = '     1         11        21        31        41';
const rulerTicks = '     |         |         |         |         |';

/** Campos da legenda interativa do preview. */
const legendFields = [
  { key: 'banco', label: 'banco' },
  { key: 'lote', label: 'lote' },
  { key: 'empresa', label: 'empresa' },
  { key: 'conta', label: 'conta' },
  { key: 'valor', label: 'valor' },
  { key: 'venc', label: 'vencimento' },
];

function segmentClass(field: string): Record<string, boolean> {
  return {
    seg: true,
    'seg--hot': hotField.value === field && !(field === 'valor' && !demoValidationOn.value),
    'seg--bad': field === 'valor' && !demoValidationOn.value,
  };
}
</script>

<template>
  <div class="landing">
    <!-- HERO -->
    <section class="hero">
      <div class="hero__grid">
        <div>
          <span class="hero__eyebrow"
            ><span aria-hidden="true">●</span> open-source · roda no seu navegador</span
          >
          <h1 class="hero__title">
            Arquivos bancários <span class="hero__hl">FEBRABAN</span>, gerados na força de um
            espresso.
          </h1>
          <p class="hero__sub">
            RCB001, CNAB240 e CNAB400 prontos para testar seus sistemas. Sem montar na unha, sem
            login e sem deixar dado em lugar nenhum.
          </p>
          <div class="hero__cta">
            <router-link to="/gerador" class="btn btn--primary" data-testid="cta-generate">
              <span aria-hidden="true">☕</span> Gerar meu arquivo
            </router-link>
            <a href="#como" class="btn btn--ghost">Ver como funciona</a>
          </div>
          <p class="hero__note">
            <span aria-hidden="true">🔒</span> Seus dados nunca saem do seu navegador — aderência à
            LGPD.
          </p>
        </div>

        <!-- Preview do visualizador (componente-assinatura) -->
        <div
          class="term"
          role="img"
          aria-label="Visualizador de um arquivo CNAB com régua de posições e validação ligada ou desligada."
        >
          <div class="term__bar">
            <span class="term__dot" style="background: #f26d6d" />
            <span class="term__dot" style="background: #f2c94c" />
            <span class="term__dot" style="background: #5fbf8f" />
            <span class="term__title">remessa_cnab240.rem</span>
            <span class="lpd-badge" :class="demoValidationOn ? 'lpd-badge--ok' : 'lpd-badge--warn'">
              <span aria-hidden="true">{{ demoValidationOn ? '✓' : '!' }}</span>
              validação: {{ demoValidationOn ? 'on' : 'off' }}
            </span>
          </div>
          <div class="term__body">
            <div class="term__ruler">{{ rulerNumbers }}</div>
            <div class="term__ruler">{{ rulerTicks }}</div>
            <div class="term__code">
              <span class="term__ln">01 </span><span :class="segmentClass('banco')">341</span
              ><span :class="segmentClass('lote')">0001</span>3REMESSA<span
                :class="segmentClass('empresa')"
                >EMPRESATESTELTDA</span
              >
            </div>
            <div class="term__code">
              <span class="term__ln">02 </span><span :class="segmentClass('banco')">341</span
              ><span :class="segmentClass('conta')">000012345</span
              ><span :class="segmentClass('valor')">{{
                demoValidationOn ? '000000150000' : '0000ABC50000'
              }}</span
              ><span :class="segmentClass('venc')">15062026</span>
            </div>
            <div class="term__code">
              <span class="term__ln">03 </span>9TRAILER<span :class="segmentClass('qtd')"
                >000003</span
              ><span :class="segmentClass('total')">000000150000</span>
            </div>
          </div>
          <div class="term__foot">
            <button
              class="term__switch"
              :aria-pressed="demoValidationOn"
              aria-label="Habilitar ou desabilitar a validação por campo"
              @click="demoValidationOn = !demoValidationOn"
            >
              <span class="term__track" aria-hidden="true" /> validação por campo
            </button>
            <router-link to="/gerador" class="term__gen">
              <span aria-hidden="true">▸</span> Gerar arquivo
            </router-link>
          </div>
        </div>
      </div>

      <div class="hero__legend">
        <button
          v-for="field in legendFields"
          :key="field.key"
          class="legend-chip"
          @mouseenter="hotField = field.key"
          @mouseleave="hotField = null"
          @focus="hotField = field.key"
          @blur="hotField = null"
        >
          {{ field.label }}
        </button>
        <span class="legend-chip legend-chip--static"
          >↑ passe o mouse para destacar o campo no arquivo</span
        >
      </div>
    </section>

    <!-- PROBLEMA → SOLUÇÃO -->
    <section id="como" class="block">
      <p class="block__lead">o problema</p>
      <h2 class="block__title">
        Montar arquivo bancário na unha é contar caractere por caractere.
      </h2>
      <p class="block__desc">
        Cada posição importa. Um espaço a mais e o banco rejeita o arquivo. O Leiautes Para Devs
        monta as posições por você e mostra tudo num visualizador monoespaçado com régua — você
        confere de bater o olho.
      </p>
      <div class="compare">
        <div class="compare__pane compare__pane--before">
          <h3><span aria-hidden="true">✗</span> Antes — no editor de texto</h3>
          <pre>
341000100012345?????????
"era 9 ou 12 dígitos no valor?"
"esse campo alinha à esquerda?"
"faltou um zero... de novo."</pre>
        </div>
        <div class="compare__pane compare__pane--after">
          <h3><span aria-hidden="true">✓</span> Agora — no Leiautes Para Devs</h3>
          <pre>
     1         11        21
01 3410001000123450000150000
campos validados pelas rules
do Quasar · baixe em segundos</pre>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="block">
      <p class="block__lead">por que usar</p>
      <h2 class="block__title">Feito para o seu fluxo de teste.</h2>
      <div class="grid3">
        <div class="card">
          <span class="card__icon" aria-hidden="true">⚡</span>
          <h3>Geração em segundos</h3>
          <p>
            RCB001, CNAB240 e CNAB400, remessa e retorno. Da página aberta ao arquivo baixado em
            menos de um minuto.
          </p>
        </div>
        <div class="card">
          <span class="card__icon" aria-hidden="true">🎚️</span>
          <h3>Validação que liga e desliga</h3>
          <p>
            Ligada, garante arquivos confiáveis. Desligada, deixa você
            <strong>forçar erros de propósito</strong> para testar como seu sistema reage.
          </p>
        </div>
        <div class="card">
          <span class="card__icon" aria-hidden="true">🔒</span>
          <h3>Privado por arquitetura</h3>
          <p>
            Roda no navegador, sem backend. O estado vive só na sessão (Pinia) e some quando você
            fecha a aba. LGPD por design.
          </p>
        </div>
      </div>
    </section>

    <!-- LEIAUTES -->
    <section id="leiautes" class="block">
      <p class="block__lead">leiautes</p>
      <h2 class="block__title">Padrões homologados pela FEBRABAN.</h2>
      <p class="block__desc">Começando pelos mais pedidos — e crescendo a cada release.</p>
      <div class="layouts">
        <span class="layout-pill"><strong>RCB001</strong> <em>disponível</em></span>
        <span class="layout-pill"><strong>CNAB240</strong> <em>disponível</em></span>
        <span class="layout-pill"><strong>CNAB400</strong> <em>disponível</em></span>
        <span class="layout-pill layout-pill--soon"><strong>+ mais</strong> <em>em breve</em></span>
      </div>
    </section>

    <!-- PRIVACIDADE -->
    <section id="privacidade" class="block">
      <div class="privacy">
        <span class="privacy__lock" aria-hidden="true">🔒</span>
        <div>
          <h2>Seus dados nunca saem do seu navegador.</h2>
          <p>
            Não há banco de dados, não há conta, não há servidor guardando nada. Tudo vive em
            memória (Pinia) pelo tempo da sessão e é apagado quando você fecha a aba. Pode preencher
            dados de teste à vontade — isso é uma decisão de arquitetura, não é um rodapé.
          </p>
        </div>
      </div>
    </section>

    <!-- PARA QUEM É -->
    <section id="quem" class="block">
      <p class="block__lead">para quem é</p>
      <h2 class="block__title">Quem vive de integração bancária.</h2>
      <div class="grid3">
        <div class="card card--persona">
          <p class="card__who">desenvolvedora</p>
          <h3>Marina</h3>
          <p>
            Constrói o parser de retorno do banco. Precisa de dezenas de variações para cobrir casos
            de teste — com a validação ligada, todas válidas.
          </p>
        </div>
        <div class="card card--persona">
          <p class="card__who">qa / tester</p>
          <h3>Rafael</h3>
          <p>
            Testa o módulo financeiro. Desliga a validação e gera arquivos malformados de propósito
            para ver como o sistema que está sendo desenvolvido se comporta.
          </p>
        </div>
        <div class="card card--persona">
          <p class="card__who">implantação</p>
          <h3>Cláudia</h3>
          <p>
            Homologa a importação de clientes novos. Simula a remessa do cliente com clareza visual
            e exportação confiável.
          </p>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="final">
      <h2>Pega o café e gere o seu arquivo. ☕</h2>
      <p>Grátis, open-source e direto no navegador.</p>
      <router-link to="/gerador" class="btn btn--primary">
        <span aria-hidden="true">▸</span> Gerar meu arquivo
      </router-link>
    </section>
  </div>
</template>

<style scoped lang="scss">
.landing {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

// --- Botões da landing ---
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 46px;
  padding: 0 20px;
  border-radius: var(--lpd-radius-md);
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.15s ease;
}

.btn--primary {
  background: var(--lpd-accent);
  color: var(--lpd-on-accent);

  &:hover {
    background: var(--lpd-accent-hover);
  }
}

.btn--ghost {
  background: transparent;
  border-color: var(--lpd-border);
  color: var(--lpd-text);

  &:hover {
    background: var(--lpd-surface-2);
  }
}

// --- Hero ---
.hero {
  padding: 72px 0 60px;
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 54px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--lpd-font-mono);
  font-size: 13px;
  color: var(--lpd-accent);
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-border);
  padding: 6px 12px;
  border-radius: var(--lpd-radius-full);
  margin-bottom: 22px;
}

.hero__title {
  font-size: clamp(34px, 5vw, 52px);
  letter-spacing: -0.5px;
  margin: 0;
}

.hero__hl {
  color: var(--lpd-accent);
}

.hero__sub {
  font-size: 19px;
  color: var(--lpd-text-muted);
  margin: 20px 0 30px;
  max-width: 42ch;
}

.hero__cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero__note {
  margin-top: 18px;
  font-size: 13px;
  color: var(--lpd-text-muted);
  display: flex;
  align-items: center;
  gap: 7px;
}

// --- Terminal preview (assinatura) ---
.term {
  background: var(--lpd-term-bg);
  border: 1px solid var(--lpd-term-border);
  border-radius: var(--lpd-radius-lg);
  overflow: hidden;
  box-shadow: var(--lpd-shadow-lg);
}

.term__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 15px;
  background: var(--lpd-term-surface);
  border-bottom: 1px solid var(--lpd-term-border);

  .lpd-badge {
    margin-left: auto;
  }
}

.term__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.term__title {
  font-family: var(--lpd-font-mono);
  font-size: 12px;
  color: var(--lpd-term-muted);
  margin-left: 6px;
}

.term__body {
  padding: 16px;
  font-family: var(--lpd-font-mono);
  font-size: 12.5px;
  line-height: 1.85;
  overflow-x: auto;
}

.term__ruler {
  color: var(--lpd-term-muted);
  white-space: pre;
  user-select: none;
}

.term__code {
  white-space: pre;
  color: var(--lpd-term-text);
}

.term__ln {
  color: var(--lpd-term-muted);
  user-select: none;
}

.seg {
  border-radius: 3px;
  padding: 1px 0;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.seg--hot {
  background: rgba(242, 160, 61, 0.22);
  color: var(--lpd-accent-hover);
}

.seg--bad {
  background: rgba(242, 109, 109, 0.22);
  color: var(--lpd-error);
}

.term__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid var(--lpd-term-border);
  flex-wrap: wrap;
}

.term__switch {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-size: 12.5px;
  color: var(--lpd-term-muted);
  cursor: pointer;
  font-family: var(--lpd-font-body);
  background: none;
  border: none;
  min-height: 44px;
}

.term__track {
  width: 38px;
  height: 22px;
  border-radius: var(--lpd-radius-full);
  background: #4a3a2a;
  position: relative;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #f5e9d6;
    transition: transform 0.2s ease;
  }
}

.term__switch[aria-pressed='true'] .term__track {
  background: var(--lpd-accent);

  &::after {
    transform: translateX(16px);
  }
}

.term__gen {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  background: var(--lpd-accent);
  color: var(--lpd-on-accent);
  font-weight: 500;
  font-size: 13px;
  border: none;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background: var(--lpd-accent-hover);
  }
}

.hero__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 14px;
}

.legend-chip {
  font-family: var(--lpd-font-mono);
  font-size: 11.5px;
  color: var(--lpd-text-muted);
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-border);
  padding: 4px 10px;
  border-radius: var(--lpd-radius-full);
  cursor: pointer;

  &:hover:not(.legend-chip--static) {
    color: var(--lpd-text);
    border-color: var(--lpd-accent);
  }
}

.legend-chip--static {
  cursor: default;
}

// --- Blocos ---
.block {
  padding: 72px 0;
  border-top: 1px solid var(--lpd-border);
}

.block__lead {
  font-family: var(--lpd-font-mono);
  font-size: 13px;
  color: var(--lpd-accent);
  letter-spacing: 0.04em;
  margin-bottom: 12px;
}

.block__title {
  font-size: clamp(26px, 3.4vw, 36px);
  letter-spacing: -0.4px;
  max-width: 24ch;
  margin: 0;
}

.block__desc {
  color: var(--lpd-text-muted);
  font-size: 17px;
  margin-top: 14px;
  max-width: 62ch;
}

// --- Compare ---
.compare {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 36px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
}

.compare__pane {
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-lg);
  padding: 20px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 14px;
  }

  pre {
    font-family: var(--lpd-font-mono);
    font-size: 12px;
    line-height: 1.8;
    color: var(--lpd-text-muted);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
}

.compare__pane--before h3 {
  color: var(--lpd-error);
}

.compare__pane--after {
  h3 {
    color: var(--lpd-success);
  }

  pre {
    color: var(--lpd-text);
  }
}

// --- Grids de cards ---
.grid3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 40px;
}

.card {
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-lg);
  padding: 24px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 9px;
  }

  p {
    color: var(--lpd-text-muted);
    font-size: 15px;
    margin: 0;
  }

  strong {
    color: var(--lpd-text);
    font-weight: 500;
  }
}

.card__icon {
  font-size: 24px;
  margin-bottom: 14px;
  display: block;
}

.card__who {
  font-family: var(--lpd-font-mono);
  font-size: 12px;
  color: var(--lpd-accent);
  margin: 0 0 6px;
}

// --- Leiautes ---
.layouts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 36px;
}

.layout-pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--lpd-font-mono);
  font-size: 14px;
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-border);
  padding: 12px 18px;
  border-radius: var(--lpd-radius-md);

  em {
    font-style: normal;
    font-size: 11px;
    color: var(--lpd-success);
  }
}

.layout-pill--soon {
  color: var(--lpd-text-muted);

  em {
    color: var(--lpd-text-muted);
  }
}

// --- Privacidade ---
.privacy {
  background: var(--lpd-surface);
  border: 1px solid var(--lpd-border);
  border-radius: var(--lpd-radius-lg);
  padding: 40px;
  display: flex;
  gap: 28px;
  align-items: flex-start;

  h2 {
    font-size: clamp(24px, 3vw, 32px);
    margin: 0 0 12px;
  }

  p {
    color: var(--lpd-text-muted);
    font-size: 17px;
    max-width: 60ch;
    margin: 0;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    padding: 28px;
  }
}

.privacy__lock {
  font-size: 34px;
  flex-shrink: 0;
}

// --- CTA final ---
.final {
  text-align: center;
  padding: 96px 0;
  border-top: 1px solid var(--lpd-border);

  h2 {
    font-size: clamp(28px, 4vw, 42px);
    margin: 0 0 16px;
  }

  p {
    color: var(--lpd-text-muted);
    font-size: 18px;
    margin-bottom: 30px;
  }
}
</style>
