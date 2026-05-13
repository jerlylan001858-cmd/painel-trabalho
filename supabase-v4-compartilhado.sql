-- Atualização v4
-- Cole tudo no Supabase SQL Editor e clique em Run.
-- Esta atualização deixa os dados compartilhados entre todos os usuários logados,
-- cria a escala compartilhada e cria a aba de OS abertas/protocolos.

create table if not exists app_config (
  chave text primary key,
  valor text,
  atualizado_por uuid references auth.users(id) on delete set null,
  atualizado_em timestamp with time zone default now()
);

alter table app_config enable row level security;

drop policy if exists "shared select app_config" on app_config;
drop policy if exists "shared insert app_config" on app_config;
drop policy if exists "shared update app_config" on app_config;
drop policy if exists "shared delete app_config" on app_config;

create policy "shared select app_config" on app_config for select using (auth.role() = 'authenticated');
create policy "shared insert app_config" on app_config for insert with check (auth.role() = 'authenticated');
create policy "shared update app_config" on app_config for update using (auth.role() = 'authenticated');
create policy "shared delete app_config" on app_config for delete using (auth.role() = 'authenticated');

create table if not exists ordens_servico (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  protocolo text not null,
  descricao text,
  status text default 'aberta',
  criado_em timestamp with time zone default now()
);

alter table ordens_servico enable row level security;

drop policy if exists "shared select ordens_servico" on ordens_servico;
drop policy if exists "shared insert ordens_servico" on ordens_servico;
drop policy if exists "shared update ordens_servico" on ordens_servico;
drop policy if exists "shared delete ordens_servico" on ordens_servico;

create policy "shared select ordens_servico" on ordens_servico for select using (auth.role() = 'authenticated');
create policy "shared insert ordens_servico" on ordens_servico for insert with check (auth.role() = 'authenticated');
create policy "shared update ordens_servico" on ordens_servico for update using (auth.role() = 'authenticated');
create policy "shared delete ordens_servico" on ordens_servico for delete using (auth.role() = 'authenticated');

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
drop policy if exists "shared select os_noc" on os_noc;
drop policy if exists "shared insert os_noc" on os_noc;
drop policy if exists "shared update os_noc" on os_noc;
drop policy if exists "shared delete os_noc" on os_noc;
create policy "shared select os_noc" on os_noc for select using (auth.role() = 'authenticated');
create policy "shared insert os_noc" on os_noc for insert with check (auth.role() = 'authenticated');
create policy "shared update os_noc" on os_noc for update using (auth.role() = 'authenticated');
create policy "shared delete os_noc" on os_noc for delete using (auth.role() = 'authenticated');

-- A partir daqui: as tabelas antigas passam a ser compartilhadas entre todos os usuários logados.

alter table anotacoes enable row level security;
drop policy if exists "select own anotacoes" on anotacoes;
drop policy if exists "insert own anotacoes" on anotacoes;
drop policy if exists "update own anotacoes" on anotacoes;
drop policy if exists "delete own anotacoes" on anotacoes;
drop policy if exists "shared select anotacoes" on anotacoes;
drop policy if exists "shared insert anotacoes" on anotacoes;
drop policy if exists "shared update anotacoes" on anotacoes;
drop policy if exists "shared delete anotacoes" on anotacoes;
create policy "shared select anotacoes" on anotacoes for select using (auth.role() = 'authenticated');
create policy "shared insert anotacoes" on anotacoes for insert with check (auth.role() = 'authenticated');
create policy "shared update anotacoes" on anotacoes for update using (auth.role() = 'authenticated');
create policy "shared delete anotacoes" on anotacoes for delete using (auth.role() = 'authenticated');

alter table mensagens_rapidas enable row level security;
drop policy if exists "select own mensagens" on mensagens_rapidas;
drop policy if exists "insert own mensagens" on mensagens_rapidas;
drop policy if exists "update own mensagens" on mensagens_rapidas;
drop policy if exists "delete own mensagens" on mensagens_rapidas;
drop policy if exists "shared select mensagens" on mensagens_rapidas;
drop policy if exists "shared insert mensagens" on mensagens_rapidas;
drop policy if exists "shared update mensagens" on mensagens_rapidas;
drop policy if exists "shared delete mensagens" on mensagens_rapidas;
create policy "shared select mensagens" on mensagens_rapidas for select using (auth.role() = 'authenticated');
create policy "shared insert mensagens" on mensagens_rapidas for insert with check (auth.role() = 'authenticated');
create policy "shared update mensagens" on mensagens_rapidas for update using (auth.role() = 'authenticated');
create policy "shared delete mensagens" on mensagens_rapidas for delete using (auth.role() = 'authenticated');

alter table links_importantes enable row level security;
drop policy if exists "select own links" on links_importantes;
drop policy if exists "insert own links" on links_importantes;
drop policy if exists "update own links" on links_importantes;
drop policy if exists "delete own links" on links_importantes;
drop policy if exists "shared select links" on links_importantes;
drop policy if exists "shared insert links" on links_importantes;
drop policy if exists "shared update links" on links_importantes;
drop policy if exists "shared delete links" on links_importantes;
create policy "shared select links" on links_importantes for select using (auth.role() = 'authenticated');
create policy "shared insert links" on links_importantes for insert with check (auth.role() = 'authenticated');
create policy "shared update links" on links_importantes for update using (auth.role() = 'authenticated');
create policy "shared delete links" on links_importantes for delete using (auth.role() = 'authenticated');

alter table eventos enable row level security;
drop policy if exists "select own eventos" on eventos;
drop policy if exists "insert own eventos" on eventos;
drop policy if exists "update own eventos" on eventos;
drop policy if exists "delete own eventos" on eventos;
drop policy if exists "shared select eventos" on eventos;
drop policy if exists "shared insert eventos" on eventos;
drop policy if exists "shared update eventos" on eventos;
drop policy if exists "shared delete eventos" on eventos;
create policy "shared select eventos" on eventos for select using (auth.role() = 'authenticated');
create policy "shared insert eventos" on eventos for insert with check (auth.role() = 'authenticated');
create policy "shared update eventos" on eventos for update using (auth.role() = 'authenticated');
create policy "shared delete eventos" on eventos for delete using (auth.role() = 'authenticated');

alter table registros enable row level security;
drop policy if exists "select own registros" on registros;
drop policy if exists "insert own registros" on registros;
drop policy if exists "update own registros" on registros;
drop policy if exists "delete own registros" on registros;
drop policy if exists "shared select registros" on registros;
drop policy if exists "shared insert registros" on registros;
drop policy if exists "shared update registros" on registros;
drop policy if exists "shared delete registros" on registros;
create policy "shared select registros" on registros for select using (auth.role() = 'authenticated');
create policy "shared insert registros" on registros for insert with check (auth.role() = 'authenticated');
create policy "shared update registros" on registros for update using (auth.role() = 'authenticated');
create policy "shared delete registros" on registros for delete using (auth.role() = 'authenticated');
