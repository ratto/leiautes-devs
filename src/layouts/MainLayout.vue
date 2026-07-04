<script setup lang="ts">
// Layout principal: header fixo com a marca, navegação e toggle de tema,
// e rodapé com a assinatura de origem ("movido a café extra-forte").
import ThemeToggle from '@/components/ThemeToggle.vue';
</script>

<template>
  <div class="shell">
    <header class="shell__header">
      <div class="shell__header-inner">
        <router-link to="/" class="shell__brand">
          <span class="shell__cup" aria-hidden="true">☕</span>
          Leiautes Para Devs
        </router-link>
        <nav class="shell__nav" aria-label="Navegação principal">
          <router-link to="/gerador" class="shell__nav-link" data-testid="nav-generator"
            >Gerador</router-link
          >
        </nav>
        <div class="shell__actions">
          <ThemeToggle />
          <a
            class="shell__nav-link"
            href="https://github.com/ratto/leiautes-devs"
            target="_blank"
            rel="noopener"
            >GitHub</a
          >
        </div>
      </div>
    </header>

    <main class="shell__main">
      <router-view />
    </main>

    <footer class="shell__footer">
      <div class="shell__footer-inner">
        <!-- Assinatura de origem — requisito do dono do produto (PRD §11) -->
        <span>☕ Leiautes Para Devs — feito por dev, para dev, com café extra-forte.</span>
        <div class="shell__footer-links">
          <a href="https://github.com/ratto/leiautes-para-devs" target="_blank" rel="noopener"
            >GitHub</a
          >
          <a href="https://www.linkedin.com/in/pedro-tosta-paixao/" target="_blank" rel="noopener"
            >LinkedIn</a
          >
          <a
            href="https://www.paypal.com/donate/?hosted_button_id=8RE442ASFC2PS"
            target="_blank"
            rel="noopener"
            >Apoiar ☕</a
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--lpd-base);
}

.shell__header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--lpd-base) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--lpd-border);
}

.shell__header-inner,
.shell__footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.shell__header-inner {
  height: 64px;
}

.shell__brand {
  display: flex;
  align-items: center;
  gap: 9px;
  font-family: var(--lpd-font-display);
  font-weight: 700;
  font-size: 17px;
  color: var(--lpd-text);
  text-decoration: none;
}

.shell__cup {
  font-size: 20px;
}

.shell__nav {
  margin-left: auto;
}

.shell__nav-link {
  color: var(--lpd-text-muted);
  text-decoration: none;
  font-size: 15px;

  &:hover {
    color: var(--lpd-text);
  }
}

.shell__actions {
  display: flex;
  align-items: center;
  gap: 14px;
}

.shell__main {
  flex: 1;
}

.shell__footer {
  border-top: 1px solid var(--lpd-border);
  padding: 32px 0;
  color: var(--lpd-text-muted);
  font-size: 14px;
}

.shell__footer-inner {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
}

.shell__footer-links {
  display: flex;
  gap: 18px;

  a {
    color: var(--lpd-text-muted);
    text-decoration: none;

    &:hover {
      color: var(--lpd-text);
    }
  }
}
</style>
