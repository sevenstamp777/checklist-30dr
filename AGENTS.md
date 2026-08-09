# AGENTS.md — Projeto clawd

Landing page do **Checklist de 30 Dias de Restauração** (Quando o Amor Fala).

## Fluxo de trabalho

- **Idioma**: português (pt-BR).
- **Memória**: este projeto tem memória própria em `memory/PROJECT.md`. Ler no início de cada sessão e atualizar ao final. Contexto global fica em `~/.config/opencode/memory/`.
- **Git**: só commitar/push quando solicitado. Mensagens concisas em pt-BR.

## Deploy

- Repo: `sevenstamp777/checklist-30dr` (branch `main`).
- Push em `main` → Vercel publica automaticamente em `https://checklist.transformandovidas.net.br` (~8–60s). **Sempre verificar o deploy após o push.**

## Regras do site

- **Não perder nada visual**: mudanças de aparência devem ser explicadas e aprovadas antes.
- Metadados/HTML que não alteram o layout são bem-vindos (Open Graph, meta description).
- Identidade: cores cream `#FFF8F0`, terracotta `#B65E2D`, dark `#3D2A20`, beige `#FDF6EE`; fontes Playfair Display + Inter; Tailwind via CDN (config DEPOIS do script — ordem crítica).

## Arquivos principais

| Arquivo | Função |
|---|---|
| `index.html` | Landing + formulário SendPulse embed (form `254764`) |
| `obrigado.html` | Página de sucesso com download do PDF (Google Drive) |
| `assets/css/form.css` | Overrides de estilo do formulário SendPulse |
| `tools/puppeteer-test/` | Teste de formulário (dry-run padrão; `ALLOW_LIVE_TEST=1` para enviar) |
| `memory/PROJECT.md` | Memória do projeto |
