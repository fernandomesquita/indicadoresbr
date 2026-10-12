-- Indicadores BR · estrutura do banco (Supabase / PostgreSQL)
-- Rode este arquivo inteiro no SQL Editor do Supabase, uma vez, num projeto novo.
-- Pode rodar de novo sem perder dados: os comandos usam "if not exists" e recriam só funções e regras.
--
-- Projeto criado com: Data API ligada, "Automatically expose new tables" DESLIGADO e RLS automático ligado.
-- Por isso cada tabela recebe aqui, à mão, só os privilégios que precisa (GRANT) e as regras de linha (POLICY).

-- ------------------------------------------------------------------ administradores
create table if not exists public.admins (
  email text primary key,
  criado_em timestamptz not null default now()
);
alter table public.admins enable row level security;

-- is_admin(): verdadeiro quando quem está logado tem o e-mail na tabela admins
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------------ conteúdo publicado
create table if not exists public.config (
  chave text primary key,
  valor jsonb not null
);

create table if not exists public.categorias (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text not null,
  descricao text not null default '',
  ordem int not null default 0
);

create table if not exists public.indicadores (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  categoria text not null references public.categorias(id) on update cascade,
  ordem int not null default 0,
  visivel boolean not null default true,
  conteudo jsonb not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por text
);
create index if not exists indicadores_cat_ordem on public.indicadores (categoria, ordem);

-- As colunas categoria, ordem e visivel espelham o JSON; o JSON é a referência.
-- Um indicador só fica visível com fonte preenchida.
create or replace function public.indicadores_sincroniza() returns trigger
language plpgsql set search_path = public as $$
begin
  new.conteudo := jsonb_set(new.conteudo, '{id}', to_jsonb(new.id));
  new.categoria := coalesce(new.conteudo ->> 'categoria', new.categoria);
  new.ordem := coalesce((new.conteudo ->> 'ordem')::int, 0);
  new.visivel := coalesce((new.conteudo ->> 'visivel')::boolean, true)
                 and coalesce(nullif(trim(new.conteudo #>> '{fonte,nome}'), ''), '') <> '';
  new.atualizado_em := now();
  new.atualizado_por := coalesce(auth.jwt() ->> 'email', current_user);
  return new;
end $$;
drop trigger if exists trg_indicadores_sincroniza on public.indicadores;
create trigger trg_indicadores_sincroniza before insert or update on public.indicadores
  for each row execute function public.indicadores_sincroniza();

-- Histórico: toda versão anterior de um indicador fica guardada
create table if not exists public.indicadores_historico (
  id bigint generated always as identity primary key,
  indicador_id text not null,
  conteudo jsonb not null,
  versao_de timestamptz not null,
  alterado_por text,
  guardado_em timestamptz not null default now()
);
create or replace function public.indicadores_guarda_historico() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.indicadores_historico (indicador_id, conteudo, versao_de, alterado_por)
  values (old.id, old.conteudo, old.atualizado_em, old.atualizado_por);
  return null;
end $$;
drop trigger if exists trg_indicadores_historico on public.indicadores;
create trigger trg_indicadores_historico after update or delete on public.indicadores
  for each row execute function public.indicadores_guarda_historico();

-- ------------------------------------------------------------------ envios do público
create or replace function public.conta_palavras(t text) returns int
language sql immutable as $$ select coalesce(array_length(regexp_split_to_array(trim(t), '\s+'), 1), 0) $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  indicador_id text not null,
  ponto text check (ponto is null or length(ponto) <= 500),
  motivo text not null check (public.conta_palavras(motivo) >= 5 and length(motivo) <= 3000),
  email text check (email is null or (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  pagina text check (pagina is null or length(pagina) <= 500),
  status text not null default 'novo' check (status in ('novo','em_analise','resolvido','descartado')),
  nota_interna text,
  criado_em timestamptz not null default now()
);

create table if not exists public.sugestoes (
  id uuid primary key default gen_random_uuid(),
  texto text not null check (public.conta_palavras(texto) >= 3 and length(texto) <= 3000),
  categoria text check (categoria is null or length(categoria) <= 80),
  onde text check (onde is null or length(onde) <= 1000),
  email text check (email is null or (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  status text not null default 'novo' check (status in ('novo','em_analise','resolvido','descartado')),
  nota_interna text,
  criado_em timestamptz not null default now()
);

create table if not exists public.contatos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) between 2 and 120),
  email text not null check (length(email) <= 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  assunto text not null check (assunto in ('Dúvida','Correção','Imprensa','Parceria','Outro')),
  mensagem text not null check (length(trim(mensagem)) between 10 and 5000),
  status text not null default 'novo' check (status in ('novo','em_analise','resolvido','descartado')),
  nota_interna text,
  criado_em timestamptz not null default now()
);

-- Freio contra abuso: no máximo 20 envios por tabela a cada 10 minutos, somando todos os visitantes,
-- além de 3 envios idênticos por hora. Ajuste os números se o portal crescer.
create or replace function public.freio_envios() returns trigger
language plpgsql security definer set search_path = public as $$
declare recentes int; iguais int; coluna text; texto text;
begin
  execute format('select count(*) from public.%I where criado_em > now() - interval ''10 minutes''', tg_table_name) into recentes;
  if recentes >= 20 then raise exception 'muitos envios em pouco tempo' using errcode = 'P0001'; end if;
  coluna := case tg_table_name when 'reports' then 'motivo' when 'sugestoes' then 'texto' else 'mensagem' end;
  texto := to_jsonb(new) ->> coluna;
  execute format('select count(*) from public.%I where criado_em > now() - interval ''1 hour'' and %I = $1', tg_table_name, coluna)
    into iguais using texto;
  if iguais >= 3 then raise exception 'envio repetido' using errcode = 'P0001'; end if;
  return new;
end $$;
drop trigger if exists trg_freio_reports on public.reports;
create trigger trg_freio_reports before insert on public.reports for each row execute function public.freio_envios();
drop trigger if exists trg_freio_sugestoes on public.sugestoes;
create trigger trg_freio_sugestoes before insert on public.sugestoes for each row execute function public.freio_envios();
drop trigger if exists trg_freio_contatos on public.contatos;
create trigger trg_freio_contatos before insert on public.contatos for each row execute function public.freio_envios();

-- ------------------------------------------------------------------ segurança por linha (RLS)
alter table public.config enable row level security;
alter table public.categorias enable row level security;
alter table public.indicadores enable row level security;
alter table public.indicadores_historico enable row level security;
alter table public.reports enable row level security;
alter table public.sugestoes enable row level security;
alter table public.contatos enable row level security;

-- privilégios de tabela (a RLS filtra linha por linha depois disso)
grant select on public.config, public.categorias, public.indicadores to anon, authenticated;
grant insert, update, delete on public.config, public.categorias, public.indicadores to authenticated;
grant select on public.indicadores_historico to authenticated;
grant insert on public.reports, public.sugestoes, public.contatos to anon, authenticated;
grant select, update, delete on public.reports, public.sugestoes, public.contatos to authenticated;
grant select on public.admins to authenticated;

-- leitura pública
drop policy if exists "config: todos leem" on public.config;
create policy "config: todos leem" on public.config for select using (true);
drop policy if exists "categorias: todos leem" on public.categorias;
create policy "categorias: todos leem" on public.categorias for select using (true);
drop policy if exists "indicadores: publico le visiveis" on public.indicadores;
create policy "indicadores: publico le visiveis" on public.indicadores for select using (visivel or public.is_admin());

-- escrita só de administradores
drop policy if exists "config: admin escreve" on public.config;
create policy "config: admin escreve" on public.config for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "categorias: admin escreve" on public.categorias;
create policy "categorias: admin escreve" on public.categorias for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "indicadores: admin escreve" on public.indicadores;
create policy "indicadores: admin escreve" on public.indicadores for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "historico: admin le" on public.indicadores_historico;
create policy "historico: admin le" on public.indicadores_historico for select to authenticated using (public.is_admin());
drop policy if exists "admins: cada um ve o seu" on public.admins;
create policy "admins: cada um ve o seu" on public.admins for select to authenticated using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- envios: qualquer visitante grava, só administrador lê e muda
do $$
declare t text;
begin
  foreach t in array array['reports','sugestoes','contatos'] loop
    execute format('drop policy if exists "%s: qualquer um envia" on public.%I', t, t);
    execute format('create policy "%s: qualquer um envia" on public.%I for insert to anon, authenticated with check (status = ''novo'' and nota_interna is null)', t, t);
    execute format('drop policy if exists "%s: admin le" on public.%I', t, t);
    execute format('create policy "%s: admin le" on public.%I for select to authenticated using (public.is_admin())', t, t);
    execute format('drop policy if exists "%s: admin atualiza" on public.%I', t, t);
    execute format('create policy "%s: admin atualiza" on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
    execute format('drop policy if exists "%s: admin apaga" on public.%I', t, t);
    execute format('create policy "%s: admin apaga" on public.%I for delete to authenticated using (public.is_admin())', t, t);
  end loop;
end $$;

-- ------------------------------------------------------------------ primeiro administrador
-- Depois de criar seu usuário em Authentication > Users (e-mail e senha), rode:
-- insert into public.admins (email) values ('seu-email@exemplo.com') on conflict do nothing;
