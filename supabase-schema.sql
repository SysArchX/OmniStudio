-- OmniStudio: esquema do Supabase
-- Execute no SQL Editor do projeto Supabase. Requer o provedor Google habilitado em
-- Authentication > Providers e a URL de retorno cadastrada em Authentication > URL Configuration.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.conversations (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  title text not null default 'Conversa',
  messages jsonb not null default '[]'::jsonb,
  created_at bigint not null default 0,
  updated_at bigint not null default 0,
  primary key (user_id, id)
);

create table if not exists public.api_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  groq text not null default '',
  openrouter text not null default '',
  github text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.conversations enable row level security;
alter table public.api_keys enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "own settings" on public.app_settings;
create policy "own settings" on public.app_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own keys" on public.api_keys;
create policy "own keys" on public.api_keys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Chaves adicionadas depois: Mistral e a chave pessoal da Composio.
alter table public.api_keys add column if not exists mistral text not null default '';
alter table public.api_keys add column if not exists composio text not null default '';

-- Controle remoto: o app instalado publica presença e recebe tarefas do celular.
create table if not exists public.remote_sessions (
  user_id uuid not null references auth.users (id) on delete cascade,
  device_id text not null,
  device_name text not null default '',
  os text not null default '',
  status text not null default 'online',
  last_seen timestamptz not null default now(),
  primary key (user_id, device_id)
);

create table if not exists public.remote_commands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  command text not null,
  status text not null default 'queued',
  output text not null default '',
  created_at timestamptz not null default now()
);

alter table public.remote_sessions enable row level security;
alter table public.remote_commands enable row level security;

drop policy if exists "own remote sessions" on public.remote_sessions;
create policy "own remote sessions" on public.remote_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own remote commands" on public.remote_commands;
create policy "own remote commands" on public.remote_commands
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Pareamento por código (OMNI-XXXX): o app cria, o navegador logado autoriza.
create table if not exists public.device_auth_codes (
  code text primary key,
  device_name text not null default '',
  status text not null default 'pending',
  access_token text,
  refresh_token text,
  user_email text,
  created_at timestamptz not null default now()
);

create index if not exists device_auth_codes_created_at_idx
  on public.device_auth_codes (created_at desc);

alter table public.device_auth_codes enable row level security;

drop policy if exists "pair create" on public.device_auth_codes;
create policy "pair create" on public.device_auth_codes
  for insert to anon, authenticated with check (true);

-- Só códigos recentes são legíveis; o código em si é o segredo de curta duração.
drop policy if exists "pair read" on public.device_auth_codes;
create policy "pair read" on public.device_auth_codes
  for select to anon, authenticated
  using (created_at > now() - interval '10 minutes');

drop policy if exists "pair approve" on public.device_auth_codes;
create policy "pair approve" on public.device_auth_codes
  for update to authenticated using (true) with check (status = 'approved');

-- Limpeza opcional: rode de tempos em tempos para descartar códigos antigos.
-- delete from public.device_auth_codes where created_at < now() - interval '1 day';
