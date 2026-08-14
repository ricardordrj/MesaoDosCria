# Roadmap — Mesão dos Cria

Documento pra situar o estado do projeto e o que ainda falta. Atualizado em
**2026-08-14**.

## Contexto

App do mesão de Magic: Commander extraído do projeto pessoal `organizator3000`,
onde era um módulo acoplado. Aqui ele vive **standalone** — frontend, backend,
banco e autenticação próprios — pra poder ser hospedado num subdomínio e
compartilhado com os amigos (cada um entra com a senha da sala).

> O módulo original **continua no `organizator3000`** também (não foi removido de lá).

## ✅ Feito

- [x] **Extração standalone**: frontend (React + Vite + Tailwind) e backend
      (Fastify + Drizzle + SQLite) só com o que o mesão usa, sem dependência do
      app original. Bundle do front caiu de ~931 kB → ~507 kB.
- [x] **Banco próprio**: só as 5 tabelas do commander, com migration inicial
      gerada do zero (`server/drizzle/0000_*.sql`).
- [x] **Autenticação nova e desacoplada**: trocado o Cloudflare Access por
      **login com senha compartilhada** → token de sessão assinado (JWT).
      Sem serviço externo.
- [x] **Verificado**: build do front, build do back e lint passando; smoke test
      end-to-end do fluxo de auth + rotas (login, token, CRUD, ranking) 11/11.
- [x] **Repositório no GitHub**: `ricardordrj/MesaoDosCria`.
- [x] **Arquivos de deploy**: `deploy/` (service porta 4100, Caddyfile do
      subdomínio, deploy.sh), workflow de auto-deploy e `DEPLOY.md`.

## 🔜 Pendente — colocar no ar (passos manuais na VPS)

Tudo detalhado no [`DEPLOY.md`](./DEPLOY.md). Resumo do que falta fazer na VPS:

- [ ] `git clone` + `npm ci` + `npm run build:all` + `npm run db:migrate -w server`
- [ ] Criar `~/MesaoDosCria/.env` com **`ACCESS_PASSWORD`** (senha da sala) e
      **`SESSION_SECRET`** (`openssl rand -hex 32`)
- [ ] Instalar o serviço systemd (`mesaodoscria`, porta 4100) + `enable-linger`
- [ ] Adicionar o bloco do subdomínio ao `/etc/caddy/Caddyfile` + `reload caddy`
- [ ] Criar o registro DNS **A** `mesao` → IP da VPS na Cloudflare
- [ ] **NÃO** criar Access Application pro subdomínio (login é pela senha própria)
- [ ] Cadastrar os secrets `VPS_HOST` e `VPS_SSH_KEY` **neste** repo (Actions)
- [ ] Testar `https://mesao.ricardordrj.com` e o auto-deploy (push na `main`)

## 💡 Ideias / melhorias futuras (discutidas, não iniciadas)

- [ ] **Multi-sala**: hoje é uma senha única global. Evoluir pra várias salas,
      cada uma com sua própria senha e seus próprios jogadores/ranking — pra
      grupos diferentes usarem a mesma instância isolados.
- [ ] **Identidade por login** em vez de "escolher quem eu sou" por aparelho
      (hoje cada celular seleciona o jogador localmente, sem conta).
- [ ] **Ajustes de deploy** que ficaram em aberto, se quiser: mudar a porta
      (4100) ou o subdomínio; servir sob subcaminho em vez de subdomínio (exige
      ajustar `base` do Vite + base da API + rewrite no Caddy).
- [ ] **Code-splitting** do front pra reduzir o bundle (aviso de chunk > 500 kB).
- [ ] Warning cosmético de lint em `src/components/ui/button.tsx`
      (`only-export-components`, herdado do shadcn) — sem impacto funcional.

## Topologia alvo

```
ricardordrj.com        ─Caddy→ :4000   organizator3000  (Cloudflare Access)
mesao.ricardordrj.com  ─Caddy→ :4100   MesaoDosCria     (login por senha própria)
```

Dois serviços systemd independentes, dois `.env`, dois bancos SQLite separados —
derrubar ou atualizar um não afeta o outro.
