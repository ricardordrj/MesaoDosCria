# Mesão de Commander

Contador de vida e ranking (leaderboard) para o mesão de **Magic: The Gathering — Commander**.
Cada jogador acompanha a própria vida pelo celular, manda dano/cura pros outros da
mesa e o app mantém um ranking por temporada. Feito pra ser hospedado por qualquer
pessoa e compartilhado com os amigos — basta mandar o link e a senha da sala.

App full-stack e autônomo: **React + Vite** no front, **Fastify + SQLite** no back,
com login simples por **senha compartilhada** (sem depender de nenhum serviço externo).

## Funcionalidades

- **Contador de vida** por jogador, com vida global e dano em massa.
- **Solicitações de dano/cura** entre jogadores (combate, dano de commander, ajuste manual).
- **Perfis de jogador** fixos com avatar e cor.
- **Ranking por temporada** ("board"), com histórico de temporadas anteriores e reinício.
- **Login por senha** compartilhada da sala — cada aparelho escolhe "quem eu sou".

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn (base-ui), Zustand |
| Backend | Fastify 5, Drizzle ORM, SQLite (libsql) |
| Auth | Senha compartilhada → token de sessão assinado (JWT, `jose`) |

## Rodando localmente

Requisitos: Node 20+.

```bash
npm install

# 1. Configure o backend
cp server/.env.example server/.env
#   edite server/.env e defina ACCESS_PASSWORD e SESSION_SECRET

# 2. Crie o banco (SQLite) e aplique as migrations
npm run db:migrate

# 3. Suba front + back juntos
npm run dev:all
```

- Frontend em `http://localhost:5173` (proxia `/api` pro backend em `:4000`).
- Backend em `http://localhost:4000`.

> As variáveis de ambiente do backend são lidas do ambiente do processo. Em
> desenvolvimento, exporte-as ou use um runner que carregue o `server/.env`
> (ex.: `node --env-file=server/.env ...`). Em produção, o processo/serviço
> (systemd, PM2, Docker…) deve exportar as variáveis.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Só o frontend (Vite) |
| `npm run dev:server` | Só o backend (tsx watch) |
| `npm run dev:all` | Frontend + backend juntos |
| `npm run build:all` | Build de produção (frontend + backend) |
| `npm start` | Sobe o backend de produção (serve também o front buildado) |
| `npm run lint` | oxlint |
| `npm run db:generate` | Gera uma nova migration a partir do schema |
| `npm run db:migrate` | Aplica as migrations |
| `npm run db:studio` | Abre o Drizzle Studio |

## Configuração de acesso

O acesso é controlado por uma **senha compartilhada** (`ACCESS_PASSWORD`):

- Quem acerta a senha recebe um **token de sessão** assinado (validade em `SESSION_TTL`,
  padrão 30 dias) e guardado no aparelho.
- Todas as rotas `/api/*` (menos `health`, `session` e `auth-config`) exigem o token.
- **Deixe `ACCESS_PASSWORD` em branco apenas em desenvolvimento** — nesse caso o app
  roda aberto, sem login. Em produção, defina uma senha forte e um `SESSION_SECRET`
  aleatório.

Para compartilhar com os amigos: hospede o app, defina a senha e mande o link + a senha.
Cada um entra, escolhe seu jogador e já participa do mesão e do ranking.

## Build de produção

```bash
npm run build:all      # gera dist/ (front) e server/dist/ (back)
NODE_ENV=production \
ACCESS_PASSWORD=... SESSION_SECRET=... DB_URL=file:/caminho/persistente/mesao.db \
npm start              # Fastify serve a API e o front buildado na mesma porta
```

### Deploy na VPS (subdomínio + auto-deploy)

Para hospedar num subdomínio próprio (ex.: `mesao.ricardordrj.com`) com Caddy,
systemd e deploy automático via GitHub Actions, veja o passo a passo em
[`DEPLOY.md`](./DEPLOY.md). Os arquivos prontos estão em `deploy/` e
`.github/workflows/`.

## Origem

Extraído do projeto pessoal **organizator3000**, onde o mesão era um módulo. Aqui ele
vive desacoplado, com backend, banco e autenticação próprios, para poder ser hospedado
e compartilhado de forma independente.
