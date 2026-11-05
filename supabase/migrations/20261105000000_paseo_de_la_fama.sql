-- Paseo de la Fama: la galería de reels de las alumnas.
-- El video va directo del navegador a Bunny Stream (nunca pasa por la plataforma). Acá solo se guarda el dato.
-- Se puede correr más de una vez.

-- ---------- Reels: lo que se suma a la tabla que ya existía ----------

alter table public.reels add column if not exists product_id uuid references public.products (id) on delete cascade;
alter table public.reels add column if not exists video_id text;
alter table public.reels add column if not exists title text not null default '';
alter table public.reels add column if not exists author_name text not null default '';
alter table public.reels add column if not exists handle text not null default '';
alter table public.reels add column if not exists thumb_url text;
-- 'subiendo' mientras el archivo viaja a Bunny; 'lista' cuando terminó. Solo las listas se ven en el Paseo.
alter table public.reels add column if not exists status text not null default 'lista';
alter table public.reels add column if not exists hidden boolean not null default false;
-- Premio que dan Meli y Clari (ej: "Reel de la semana"). Vacío = sin premio.
alter table public.reels add column if not exists award text;
alter table public.reels add column if not exists stars int not null default 0;

alter table public.reels drop constraint if exists reels_status_check;
alter table public.reels add constraint reels_status_check check (status in ('subiendo', 'lista'));
create index if not exists reels_paseo_idx on public.reels (created_at desc) where video_id is not null;

-- Las alumnas solo escriben el link (el botón "Publiqué un reel"). Los reels con video los crea la función "reels"
-- (con la clave de servicio) y el premio u ocultar lo cambia solo admin. Así nadie se pone un premio sola.
revoke insert, update on public.reels from authenticated;
grant insert (user_id, url) on public.reels to authenticated;
grant update (hidden, award) on public.reels to authenticated;

-- Ver el Paseo: los reels listos y no ocultos de las alumnas del mismo producto.
drop policy if exists "ver paseo" on public.reels;
create policy "ver paseo" on public.reels for select to authenticated
  using (video_id is not null and status = 'lista' and not hidden and public.owns_product(product_id));

drop policy if exists "admin edita reels" on public.reels;
create policy "admin edita reels" on public.reels for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "borrar reels" on public.reels;
create policy "borrar reels" on public.reels for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- Al terminar la subida, la alumna marca su reel como listo.
create or replace function public.reel_ready(rid uuid)
returns void language sql volatile security definer set search_path = public as $$
  update public.reels set status = 'lista' where id = rid and user_id = auth.uid()
$$;
revoke all on function public.reel_ready(uuid) from public, anon;
grant execute on function public.reel_ready(uuid) to authenticated;

-- ---------- Estrellas: cada alumna le da una a los reels que le gustan ----------

create table if not exists public.reel_stars (
  reel_id uuid not null references public.reels (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);
alter table public.reel_stars enable row level security;

drop policy if exists "mis estrellas" on public.reel_stars;
create policy "mis estrellas" on public.reel_stars for select to authenticated using (user_id = auth.uid());
-- Solo a reels que puede ver, y no a los suyos.
drop policy if exists "dar estrella" on public.reel_stars;
create policy "dar estrella" on public.reel_stars for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.reels r where r.id = reel_id and r.user_id <> auth.uid())
  );
drop policy if exists "sacar estrella" on public.reel_stars;
create policy "sacar estrella" on public.reel_stars for delete to authenticated using (user_id = auth.uid());

-- Contador de estrellas en el reel (así el Paseo no tiene que contarlas cada vez).
create or replace function public.count_reel_star()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.reels set stars = stars + 1 where id = new.reel_id;
  else
    update public.reels set stars = greatest(stars - 1, 0) where id = old.reel_id;
  end if;
  return null;
end $$;
revoke execute on function public.count_reel_star() from public, anon, authenticated;

drop trigger if exists reel_stars_count on public.reel_stars;
create trigger reel_stars_count after insert or delete on public.reel_stars
  for each row execute function public.count_reel_star();
