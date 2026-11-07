-- ANITRACK v0.3: ejecutar en Supabase > SQL Editor (con el traductor apagado).
-- 1) Corregir episodios que se pasan del total y recién después activar el límite.
update public.anime_entries set episodes_watched = episodes_total
  where episodes_total is not null and episodes_watched > episodes_total;
alter table public.anime_entries drop constraint if exists episodes_within_total;
alter table public.anime_entries add constraint episodes_within_total
  check (episodes_total is null or episodes_watched <= episodes_total);

-- 2) Perfiles privados: cada usuario ve solo el suyo.
drop policy if exists "Perfiles visibles" on public.profiles;
create policy "Ver mi perfil" on public.profiles for select using (auth.uid() = id);

-- 3) Función que solo responde si un nombre de usuario está libre (sí/no).
create or replace function public.username_available(name text)
returns boolean language sql security definer stable set search_path = '' as $$
  select not exists (select 1 from public.profiles where username = lower(trim(name)));
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- 4) El registro ya no inventa un nombre al azar si el elegido está ocupado.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare u text;
begin
  u := lower(coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)));
  insert into public.profiles (id, username, display_name) values (new.id, u, u);
  return new;
end; $$;
