# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Leiautes Para Devs** (codinome "Cisne", v2.0.0) — a client-side web app that generates Brazilian bank files (RCB001, CNAB240, CNAB400) for testing. Runs entirely in the browser; no backend, no persistence beyond the session.

Successor to a prototype (`arquivo-bancario-generator`, codinome "Patinho Feio") that lacked engineering rigor. This rewrite is built under TDD, SOLID, and strong componentization. Full docs live in `docs/`: `PRD_Leiautes_Para_Devs.md` (product requirements), `HLD_Leiautes_Para_Devs.md` (high-level design), and `design system/Design_System_Leiautes_Para_Devs.md` (visual identity).

**Brand:** "Café + Console" — dark-first, monospaced-where-it-matters, "movido a café extra-forte" as an explicit product signature (README, footer, etc.). Dark mode toggle carries a canonical easter egg tooltip: "Darkmode... por sua culpa, Erick! 😄" — preserve it.

**Non-goals:** no sending files to banks/internet banking, no cross-session persistence or user accounts, no registered boletos/production Pix QR codes, no i18n (UI is 100% PT-BR by deliberate audience decision), no bank-proprietary layouts beyond FEBRABAN standards (evaluate on demand).

## Commands

```bash
# Dev server (opens browser automatically)
npm run dev           # ou: quasar dev

# Build de produção
npm run build         # ou: quasar build

# Type checking
npm run typecheck

# Lint + format (auto-fix)
npm run lint

# Lint + format (só checar, sem alterar)
npm run lint:check

# Testes unitários (Vitest)
npm run test:unit

# Cobertura (≥ 85% é a meta)
npm run test:unit:coverage

# Testes E2E e de componente (Playwright)
npm run test:e2e
```

> Node.js ≥ 22.12 (LTS) é obrigatório.

## Architecture

The app is a **Quasar (Vue 3 + Vite)** SPA with hash-mode routing, structured as **MVVM**: Model (Core) is framework-agnostic business logic, ViewModel is Pinia stores + composables bridging state to the UI, View is the Vue components/pages. Each bank layout (RCB001, CNAB240, CNAB400) is implemented as a **Strategy** in the Model layer, so adding a new layout shouldn't require touching the UI.

### Key separation of concerns

- **`src/core/leiautes/`** — the Model. Pure TypeScript, zero UI dependency. Contains the generators, validators, check-digit calculators, and positional formatters for each layout standard (RCB001, CNAB240, CNAB400) as pluggable strategies. This is the testable heart of the project — all business rules live here.
- **`src/stores/`** — ViewModel. Pinia stores, in-memory only (no `localStorage`/`sessionStorage` by design). State lives only for the duration of the browser session. This is a deliberate LGPD-compliance decision, not a missing feature.
- **`src/composables/`** — ViewModel. Reusable logic (e.g. field validation) that orchestrates Core rules for the View.
- **`src/components/`** — View. Reusable Vue components (file viewer, field editor/registro-detalhe card, layout selector, validation toggle, etc.).
- **`src/pages/`** + **`src/layouts/`** — View. Quasar pages and layouts, kept thin.

### Router

Hash mode (`vueRouterMode: 'hash'`). Route definitions are in `src/router/routes.ts`. The `@` alias maps to `src/`.

### Validation toggle

A deliberate feature, not a shortcut: a **global on/off switch** for field validation. On (default) blocks generation of invalid files — for devs/QAs who need reliable files. Off lets QA intentionally force malformed output (wrong field size, invalid value, extra record) to test how a target system reacts to bad input. State must be visible in the UI (e.g. an "validação: on/off" badge). Logic for this toggle lives in the core layer via Quasar `rules`, not scattered across components.

## Design system

Full spec in `docs/design system/Design_System_Leiautes_Para_Devs.md` ("Café + Console"). Key points to keep consistent when touching UI:

- **Fonts:** Space Grotesk (display/headings), Inter (body/UI), JetBrains Mono (**mandatory** for file content, positions, and any positional/numeric field — alignment matters).
- **Theme tokens:** CSS variables prefixed `--lpd-*` (e.g. `--lpd-base`, `--lpd-surface`, `--lpd-accent`, `--lpd-error`), driven by `:root[data-theme="dark"|"light"]`. Dark is the default/primary theme.
- **Signature components:** the monospaced file viewer (position ruler, line numbers, field highlight on form focus) and the registro-detalhe card (reliable expand/collapse, duplicate/remove actions) are the product's defining UI — take extra care not to regress them.
- **Accessibility target:** WCAG 2.1 AA — validated color contrast, visible keyboard focus ring, ≥44×44px touch targets, respect `prefers-reduced-motion`, errors tied to fields via `aria-describedby`.

## Code conventions

- **Identifiers:** English (`isValid`, `headerFile`, `generateFile`).
- **Comments:** Portuguese-BR — encouraged, especially to explain layout rules and non-obvious FEBRABAN decisions.
- **Type imports:** enforced via ESLint (`@typescript-eslint/consistent-type-imports`).
- **Formatting:** Prettier handles formatting; ESLint handles rules. Running `npm run lint` auto-fixes both.
- **TypeScript:** strict mode enabled (`quasar.config.ts` → `typescript.strict: true`).
- **Tests:** Vitest for unit tests on core logic; Playwright for E2E and component tests of critical flows. Coverage target ≥ 85%.
