# Publicação

## 1. Banco de dados (Supabase): já configurado

Projeto `indicadoresbr`, organização DOM, endereço `https://sfroiqakkcphhnsqibsh.supabase.co`.
Configurações do projeto: Data API ligada, "Automatically expose new tables" desligado, RLS automático ligado.

Já feito em 12/10/2026:
- `supabase/schema.sql` rodado no SQL Editor (tabelas, regras de acesso, histórico, freio contra abuso).
- `fernandofmg@gmail.com` incluído na tabela `admins`.

Feito também em 12/10/2026: usuário administrador criado e cadastro aberto desligado (Authentication › Sign In / Providers).

Para refazer em outro projeto:
1. **Criar o usuário administrador:** Authentication › Users › Add user › e-mail `fernandofmg@gmail.com` e uma senha forte, com "Auto Confirm User" marcado. É com esse e-mail e senha que se entra em `/admin`.
2. **Carregar os indicadores:** depois de `python3 scripts/build.py`, cole o conteúdo de `supabase/seed.sql` no SQL Editor e rode. (Ou, com a chave secreta no ambiente, `python3 scripts/sync.py enviar`.)
3. Em Authentication › Sign In / Providers, desligue "Allow new users to sign up". Assim só existe a conta criada à mão.

Para incluir outro administrador: crie o usuário e rode no SQL Editor
`insert into public.admins (email) values ('email@exemplo.com');`

## 2. Site (Vercel ou Netlify)

**Publicado na Vercel em 12/10/2026:** projeto `indicadoresbr` na conta fernandomesquitas-projects, endereço provisório https://indicadoresbr-seven.vercel.app. Cada push na branch `main` publica de novo.

O site é estático e já vem com as páginas geradas no repositório. Não há etapa de compilação obrigatória.

**Vercel**
1. vercel.com › Add New › Project › importe `fernandomesquita/indicadoresbr`.
2. Framework Preset: **Other**. Build Command: vazio. Output Directory: `.` (raiz).
3. Deploy. O `vercel.json` cuida das rotas e dos cabeçalhos.

**Netlify**
1. app.netlify.com › Add new site › Import from Git › `fernandomesquita/indicadoresbr`.
2. O `netlify.toml` já define a pasta publicada e roda `python3 scripts/build.py` a cada deploy.

Cada commit na branch principal publica de novo automaticamente.

## 3. Domínio

1. Aponte o domínio no painel da Vercel ou da Netlify (Settings › Domains).
2. Preencha `SITE_URL` em `config.js` com o endereço final (ex.: `https://indicadoresbr.com.br`).
3. Rode `python3 scripts/build.py` (atualiza links canônicos, sitemap e prévias de link) e faça o commit.
4. No Supabase, em Authentication › URL Configuration, coloque o domínio em Site URL.

## 4. Período eleitoral

Publicação orgânica é livre. **Não impulsione páginas ou imagens do portal com verba durante a campanha**: a Lei 9.504/1997, art. 57-C, só permite impulsionamento a candidatos, partidos e coligações. Confirme com assessoria jurídica antes de qualquer impulsionamento.
