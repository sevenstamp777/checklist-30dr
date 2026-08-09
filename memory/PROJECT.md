# PROJETO — clawd (Checklist de 30 Dias de Restauração)

> Última atualização: 2026-08-09

## Estado
- Site no ar e funcionando em `checklist.transformandovidas.net.br`.
- Commits mais recentes: `b7ae642` (remove redirect imediato p/ obrigado no SendPulse), `ed1d946` (padroniza política de privacidade), `1cdc36d` (política de privacidade + link footer), `75d618c` (botão obrigado 2 linhas).
- **Páginas**: `index.html`, `obrigado.html`, `privacidade.html` (LGPD, criada 2026-08-09, commit `1cdc36d`).
- **Pinterest (automação)**: `tools/pinterest/publish.js` + `schedule.json` + `.github/workflows/pinterest.yml` (cron 08/13/19 BRT). Secret `PINTEREST_TOKEN` no repo. Arquivo local do token ignorado. App em "Trial access pending" (401 code 3) — aguardando aprovação; pins públicos exigem Standard access.

## Detalhes técnicos
- **Formulário SendPulse**: embed id `254764`, sp-hash `97a702f03a46d9473d04dee138ffd45cc33b6fec3fcd4a63ff151287f18f0f75`, loader `//web.webformscr.com/apps/fc3/build/loader.js`, wrapper `.sp-form-outer.sp-force-hide` (regra no `form.css`). Campos: Nome, Email, WhatsApp. **Sem redirect imediato para `/obrigado.html`** (removidos `submitRedirectUrl` e o MutationObserver em `b7ae642`) — o obrigado abre após o prospecto confirmar o e-mail, via configuração da SendPulse.
- **Download**: PDF no Google Drive (id `1sVIz_eTgjof9Ei1O6H2NFpSyg-7KvZeM`), link direto e link de visualização.
- **`.gitignore`**: ignora `.vercel`, `node_modules/`, `files/`, `screenshots/`, `teste-procurador/`, `memory/tokens.json`, `memory/encrypted_tokens.bin`.

## Pendências
- [ ] Adicionar tags Open Graph (og:title/image/description) em `index.html` e `obrigado.html` + UTMs nos links de pins do Pinterest (sem mudar layout).
- [ ] Pinterest: aguardar aprovação do app (Trial/Standard) → depois: deploy das imagens já feito, `node publish.js --boards`, ajustar `schedule.json`, flip para `scheduled`, teste real, ligar cron.

## Observações
- `teste-procurador/` é repo separado (`sevenstamp777/teste-procurador`), ignorado aqui.
- Nunca armazenar segredos neste arquivo.
