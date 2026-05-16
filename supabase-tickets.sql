-- Tabela de tickets
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  empresa text not null,
  responsavel text not null check (responsavel in ('Hercules', 'Franciel', 'Matheus', 'Luis')),
  tratativa text not null,
  evidencias text not null,
  prazo_informado timestamp with time zone,
  status text default 'aberto',
  criado_em timestamp with time zone default now()
);

alter table tickets enable row level security;

drop policy if exists "shared select tickets" on tickets;
drop policy if exists "shared insert tickets" on tickets;
drop policy if exists "shared update tickets" on tickets;
drop policy if exists "shared delete tickets" on tickets;

create policy "shared select tickets" on tickets for select using (auth.role() = 'authenticated');
create policy "shared insert tickets" on tickets for insert with check (auth.role() = 'authenticated');
create policy "shared update tickets" on tickets for update using (auth.role() = 'authenticated');
create policy "shared delete tickets" on tickets for delete using (auth.role() = 'authenticated');
