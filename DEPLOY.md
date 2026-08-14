# Deploy — VPS (subdomínio) + auto-deploy

Runbook pra rodar o **Mesão dos Cria** na mesma VPS do `organizator3000`, num
**subdomínio próprio** (`mesao.ricardordrj.com`) e numa **porta separada (4100)**,
sem encostar no app principal. Deploy automático a cada push na `main`.

Assume que a VPS já está de pé com **Node 24**, **Caddy** e o usuário **deploy**
(tudo isso já foi feito no runbook do `organizator3000`). Se a VPS for nova, siga
antes os passos 1–2 daquele DEPLOY.md (hardening + instalar Node e Caddy).

> Diferença-chave em relação ao app principal: o mesão tem **login próprio por
> senha** e **NÃO deve ficar atrás do Cloudflare Access**. Os amigos entram só com
> a senha da sala — se o subdomínio cair no Zero Trust, eles esbarram no login do
> Google antes de chegar no app. Por isso: **não crie uma Access Application para
> `mesao.ricardordrj.com`.**

## 1. Clonar o repositório

Como `deploy`, na home:

```bash
cd ~
git clone https://github.com/ricardordrj/MesaoDosCria.git
cd MesaoDosCria
npm ci
npm run build:all
mkdir -p server/data server/uploads
npm run db:migrate -w server
```

## 2. Configurar a senha da sala

Cria o `.env` na raiz do projeto (o serviço systemd lê ele automaticamente):

```bash
cat > ~/MesaoDosCria/.env <<'EOF'
ACCESS_PASSWORD=troque-por-uma-senha-forte-da-sala
SESSION_SECRET=cole-aqui-um-segredo-aleatorio-longo
EOF
```

Dica pra gerar um `SESSION_SECRET` aleatório: `openssl rand -hex 32`.

- `ACCESS_PASSWORD`: a senha que você manda pros amigos junto com o link.
- `SESSION_SECRET`: assina os tokens de sessão; mantenha secreto e estável
  (trocar invalida os logins de todo mundo).

> `PORT` e `NODE_ENV` já vêm do próprio serviço (passo 3), não precisa colocar aqui.
> `DB_URL` usa o padrão `server/data/mesao.db`, que é persistente entre deploys.

## 3. Rodar como serviço (systemd, sem root)

```bash
mkdir -p ~/.config/systemd/user
cp ~/MesaoDosCria/deploy/mesaodoscria.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now mesaodoscria
```

Se ainda não tiver ativado o "linger" pro usuário `deploy` (mantém o serviço
rodando após desconectar do SSH), faça uma vez:

```bash
sudo loginctl enable-linger deploy
```

Confere:

```bash
curl localhost:4100/api/health   # deve responder {"status":"ok"}
```

## 4. Caddy + subdomínio

Adiciona o bloco do subdomínio ao Caddyfile **existente** (não sobrescreve — o
bloco do `ricardordrj.com` continua lá):

```bash
cat ~/MesaoDosCria/deploy/Caddyfile | sudo tee -a /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

No painel da **Cloudflare**:

1. Em **DNS**, adiciona um registro **A**: nome `mesao`, apontando pro **IP da VPS**
   (mesmo IP do domínio principal). Deixe o proxy (nuvem laranja) como preferir —
   se ativar, use SSL/TLS em **Full**.
2. **Não** crie uma Access Application pra esse subdomínio (ver aviso no topo).

Espera a propagação de DNS e testa `https://mesao.ricardordrj.com` — deve cair na
tela de login por senha.

## 5. Deploy automático (GitHub Actions)

O deploy reaproveita a **mesma chave SSH** do `organizator3000` (mesmo usuário
`deploy`, mesma VPS). Só é preciso cadastrar os secrets **neste** repositório.

No GitHub, em `MesaoDosCria` → **Settings → Secrets and variables → Actions → New
repository secret**, cria:

- `VPS_HOST`: o IP da VPS
- `VPS_SSH_KEY`: o conteúdo da chave **privada** `deploy_key` (a mesma já usada no
  outro repo)

O workflow `.github/workflows/deploy.yml` (já no repo) roda a cada push na `main`:
entra via SSH e executa `deploy/deploy.sh`, que faz `git pull` + build + migração +
restart do serviço `mesaodoscria`.

## 6. Testar o deploy

```bash
git commit --allow-empty -m "test: dispara deploy"
git push origin main
```

Acompanha em **Actions**. Verde = `https://mesao.ricardordrj.com` já reflete a mudança.

## Resumindo a topologia

```
ricardordrj.com        ─Caddy→ localhost:4000  organizator3000  (atrás do Cloudflare Access)
mesao.ricardordrj.com  ─Caddy→ localhost:4100  MesaoDosCria     (login próprio por senha)
```

Dois serviços systemd independentes, dois `.env`, dois bancos SQLite separados.
Derrubar ou atualizar um não afeta o outro.
