-- Rode este arquivo no Supabase em SQL Editor > New Query > Run
-- Ele cria somente a tabela nova da aba OS NOC.

create table if not exists os_noc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  matricula text not null,
  nome_completo text not null,
  feito text not null,
  texto_fechamento text,
  criado_em timestamp with time zone default now()
);

alter table os_noc enable row level security;

drop policy if exists "select own os_noc" on os_noc;
drop policy if exists "insert own os_noc" on os_noc;
drop policy if exists "update own os_noc" on os_noc;
drop policy if exists "delete own os_noc" on os_noc;

create policy "select own os_noc" on os_noc for select using (auth.uid() = user_id);
create policy "insert own os_noc" on os_noc for insert with check (auth.uid() = user_id);
create policy "update own os_noc" on os_noc for update using (auth.uid() = user_id);
create policy "delete own os_noc" on os_noc for delete using (auth.uid() = user_id);
