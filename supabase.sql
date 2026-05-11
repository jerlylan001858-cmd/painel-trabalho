-- Rode este SQL no Supabase em: SQL Editor > New query > Run
-- Ele cria as tabelas e as regras para cada usuário ver apenas seus próprios dados.

create table if not exists anotacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  titulo text not null,
  conteudo text,
  categoria text,
  criado_em timestamp with time zone default now()
);

create table if not exists mensagens_rapidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  comando text,
  criado_em timestamp with time zone default now()
);

create table if not exists links_importantes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  titulo text not null,
  url text not null,
  categoria text,
  descricao text,
  criado_em timestamp with time zone default now()
);

create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  titulo text not null,
  descricao text,
  data_inicio timestamp with time zone,
  data_fim timestamp with time zone,
  lembrete_minutos integer default 30,
  status text default 'pendente',
  criado_em timestamp with time zone default now()
);

create table if not exists registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  setor text,
  titulo text not null,
  descricao text,
  prazo timestamp with time zone,
  status text default 'em andamento',
  criado_em timestamp with time zone default now()
);

alter table anotacoes enable row level security;
alter table mensagens_rapidas enable row level security;
alter table links_importantes enable row level security;
alter table eventos enable row level security;
alter table registros enable row level security;

drop policy if exists "select own anotacoes" on anotacoes;
drop policy if exists "insert own anotacoes" on anotacoes;
drop policy if exists "update own anotacoes" on anotacoes;
drop policy if exists "delete own anotacoes" on anotacoes;
create policy "select own anotacoes" on anotacoes for select using (auth.uid() = user_id);
create policy "insert own anotacoes" on anotacoes for insert with check (auth.uid() = user_id);
create policy "update own anotacoes" on anotacoes for update using (auth.uid() = user_id);
create policy "delete own anotacoes" on anotacoes for delete using (auth.uid() = user_id);

drop policy if exists "select own mensagens" on mensagens_rapidas;
drop policy if exists "insert own mensagens" on mensagens_rapidas;
drop policy if exists "update own mensagens" on mensagens_rapidas;
drop policy if exists "delete own mensagens" on mensagens_rapidas;
create policy "select own mensagens" on mensagens_rapidas for select using (auth.uid() = user_id);
create policy "insert own mensagens" on mensagens_rapidas for insert with check (auth.uid() = user_id);
create policy "update own mensagens" on mensagens_rapidas for update using (auth.uid() = user_id);
create policy "delete own mensagens" on mensagens_rapidas for delete using (auth.uid() = user_id);

drop policy if exists "select own links" on links_importantes;
drop policy if exists "insert own links" on links_importantes;
drop policy if exists "update own links" on links_importantes;
drop policy if exists "delete own links" on links_importantes;
create policy "select own links" on links_importantes for select using (auth.uid() = user_id);
create policy "insert own links" on links_importantes for insert with check (auth.uid() = user_id);
create policy "update own links" on links_importantes for update using (auth.uid() = user_id);
create policy "delete own links" on links_importantes for delete using (auth.uid() = user_id);

drop policy if exists "select own eventos" on eventos;
drop policy if exists "insert own eventos" on eventos;
drop policy if exists "update own eventos" on eventos;
drop policy if exists "delete own eventos" on eventos;
create policy "select own eventos" on eventos for select using (auth.uid() = user_id);
create policy "insert own eventos" on eventos for insert with check (auth.uid() = user_id);
create policy "update own eventos" on eventos for update using (auth.uid() = user_id);
create policy "delete own eventos" on eventos for delete using (auth.uid() = user_id);

drop policy if exists "select own registros" on registros;
drop policy if exists "insert own registros" on registros;
drop policy if exists "update own registros" on registros;
drop policy if exists "delete own registros" on registros;
create policy "select own registros" on registros for select using (auth.uid() = user_id);
create policy "insert own registros" on registros for insert with check (auth.uid() = user_id);
create policy "update own registros" on registros for update using (auth.uid() = user_id);
create policy "delete own registros" on registros for delete using (auth.uid() = user_id);
