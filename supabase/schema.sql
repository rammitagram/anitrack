-- ANITRACK: pegar todo en Supabase > SQL Editor > Run.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.anime_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  anilist_id integer not null,
  title text not null,
  native_title text,
  cover_url text,
  format text,
  episodes_total integer,
  duration_min integer,
  genres text[] not null default '{}',
  status text not null default 'Pendiente'
    check (status in ('Viendo','Completado','Pendiente','En pausa','Abandonado')),
  score integer check (score between 1 and 10),
  episodes_watched integer not null default 0 check (episodes_watched >= 0),
  started_at date,
  finished_at date,
  created_at timestamptz not null default now(),
  unique (user_id, anilist_id)
);

alter table public.profiles enable row level security;
alter table public.anime_entries enable row level security;

create policy "Perfiles visibles" on public.profiles for select using (true);
create policy "Crear mi perfil" on public.profiles for insert with check (auth.uid() = id);
create policy "Editar mi perfil" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Ver mi biblioteca" on public.anime_entries for select using (auth.uid() = user_id);
create policy "Agregar a mi biblioteca" on public.anime_entries for insert with check (auth.uid() = user_id);
create policy "Editar mi biblioteca" on public.anime_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Borrar de mi biblioteca" on public.anime_entries for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare u text;
begin
  u := lower(coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)));
  insert into public.profiles (id, username, display_name) values (new.id, u, u);
  return new;
exception when unique_violation then
  insert into public.profiles (id, username, display_name)
  values (new.id, 'user_' || substr(new.id::text, 1, 8), 'Nuevo usuario');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();
