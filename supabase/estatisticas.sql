-- Indicadores BR · estatísticas de acesso (rode no SQL Editor depois de schema.sql; pode rodar de novo sem perder dados)
--
-- O site grava um evento por página vista, busca feita e download de PNG ou CSV. Não grava IP,
-- cookie nem dado pessoal: "visitante" é um código aleatório criado no navegador, trocado todo mês,
-- que só serve para contar visitantes únicos. Navegadores com "não rastrear" e robôs não enviam nada.
-- Só administradores leem os eventos, e a leitura passa pela função public.estatisticas().

create table if not exists public.eventos (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  tipo text not null check (tipo in ('pagina', 'busca', 'png', 'csv')),
  caminho text not null check (length(caminho) between 1 and 200),
  indicador_id text check (indicador_id is null or indicador_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  termo text check (termo is null or length(termo) between 2 and 80),
  resultados int check (resultados is null or resultados between 0 and 1000),
  visitante text check (visitante is null or visitante ~ '^[a-z0-9]{8,24}$'),
  origem text check (origem is null or length(origem) <= 120),
  tela text check (tela is null or tela in ('celular', 'tablet', 'computador'))
);
create index if not exists eventos_criado on public.eventos (criado_em);
create index if not exists eventos_tipo_criado on public.eventos (tipo, criado_em);
create index if not exists eventos_visitante_criado on public.eventos (visitante, criado_em);

-- Freio contra abuso: até 150 eventos por visitante a cada 10 minutos e 5.000 no total no mesmo intervalo.
-- Acima disso o evento é descartado em silêncio (o site não mostra erro ao leitor).
create or replace function public.freio_eventos() returns trigger
language plpgsql security definer set search_path = public as $$
declare do_visitante int; total int;
begin
  if new.visitante is not null then
    select count(*) into do_visitante from public.eventos
      where visitante = new.visitante and criado_em > now() - interval '10 minutes';
    if do_visitante >= 150 then return null; end if;
  end if;
  select count(*) into total from public.eventos where criado_em > now() - interval '10 minutes';
  if total >= 5000 then return null; end if;
  new.criado_em := now();
  return new;
end $$;
drop trigger if exists trg_freio_eventos on public.eventos;
create trigger trg_freio_eventos before insert on public.eventos for each row execute function public.freio_eventos();

alter table public.eventos enable row level security;
grant insert on public.eventos to anon, authenticated;
grant select on public.eventos to authenticated;
drop policy if exists "eventos: qualquer um registra" on public.eventos;
create policy "eventos: qualquer um registra" on public.eventos for insert to anon, authenticated with check (true);
drop policy if exists "eventos: admin le" on public.eventos;
create policy "eventos: admin le" on public.eventos for select to authenticated using (public.is_admin());

-- Resumo para a aba Estatísticas do /admin. Datas no fuso de Brasília.
create or replace function public.estatisticas(dias int default 30) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare ini timestamptz; resumo jsonb;
begin
  if not public.is_admin() then raise exception 'acesso restrito' using errcode = '42501'; end if;
  dias := greatest(1, least(coalesce(dias, 30), 365));
  ini := date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo' - make_interval(days => dias - 1);
  with e as (select * from public.eventos where criado_em >= ini)
  select jsonb_build_object(
    'desde', to_char(ini at time zone 'America/Sao_Paulo', 'YYYY-MM-DD'),
    'totais', (select jsonb_build_object(
        'visitas', count(*) filter (where tipo = 'pagina'),
        'visitantes', count(distinct visitante) filter (where tipo = 'pagina'),
        'buscas', count(*) filter (where tipo = 'busca'),
        'buscas_sem_resultado', count(*) filter (where tipo = 'busca' and resultados = 0),
        'png', count(*) filter (where tipo = 'png'),
        'csv', count(*) filter (where tipo = 'csv')) from e),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('dia', d, 'visitas', v, 'visitantes', u) order by d), '[]') from (
        select to_char(g, 'YYYY-MM-DD') d,
               (select count(*) from e where tipo = 'pagina' and (criado_em at time zone 'America/Sao_Paulo')::date = g::date) v,
               (select count(distinct visitante) from e where tipo = 'pagina' and (criado_em at time zone 'America/Sao_Paulo')::date = g::date) u
        from generate_series((ini at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') g) x),
    'paginas', (select coalesce(jsonb_agg(jsonb_build_object('caminho', caminho, 'visitas', n, 'visitantes', u) order by n desc), '[]') from (
        select caminho, count(*) n, count(distinct visitante) u from e where tipo = 'pagina' group by caminho order by n desc limit 25) x),
    'indicadores', (select coalesce(jsonb_agg(jsonb_build_object('id', indicador_id, 'visitas', v, 'png', p, 'csv', c) order by v desc, p desc), '[]') from (
        select indicador_id, count(*) filter (where tipo = 'pagina') v, count(*) filter (where tipo = 'png') p, count(*) filter (where tipo = 'csv') c
        from e where indicador_id is not null group by indicador_id order by 2 desc, 3 desc limit 50) x),
    'buscas', (select coalesce(jsonb_agg(jsonb_build_object('termo', termo, 'vezes', n, 'resultados', media) order by n desc), '[]') from (
        select termo, count(*) n, round(avg(resultados))::int media from e where tipo = 'busca' group by termo order by n desc limit 40) x),
    'sem_resultado', (select coalesce(jsonb_agg(jsonb_build_object('termo', termo, 'vezes', n) order by n desc), '[]') from (
        select termo, count(*) n from e where tipo = 'busca' and resultados = 0 group by termo order by n desc limit 40) x),
    'origens', (select coalesce(jsonb_agg(jsonb_build_object('origem', o, 'visitas', n) order by n desc), '[]') from (
        select coalesce(nullif(origem, ''), 'direto ou sem informação') o, count(*) n from e where tipo = 'pagina' group by 1 order by n desc limit 20) x),
    'telas', (select coalesce(jsonb_agg(jsonb_build_object('tela', t, 'visitas', n) order by n desc), '[]') from (
        select coalesce(tela, 'sem informação') t, count(*) n from e where tipo = 'pagina' group by 1) x)
  ) into resumo;
  return resumo;
end $$;
revoke all on function public.estatisticas(int) from public;
grant execute on function public.estatisticas(int) to authenticated;
