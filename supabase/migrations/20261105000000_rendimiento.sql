-- Rendimiento: los permisos (RLS) hacen las mismas comprobaciones, pero más rápido.
-- Antes is_admin(), auth.uid() y el mail de la sesión se calculaban fila por fila; envueltos en (select ...)
-- Postgres los calcula una sola vez por consulta. Las clases ya no buscan su escena una por una.
-- Se puede correr más de una vez.

-- ---------- Perfiles ----------
drop policy if exists "perfil propio" on public.profiles;
create policy "perfil propio" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admin edita perfiles" on public.profiles;
create policy "admin edita perfiles" on public.profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Productos ----------
drop policy if exists "admin productos" on public.products;
create policy "admin productos" on public.products for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Escenas ----------
drop policy if exists "ver escenas compradas" on public.modules;
create policy "ver escenas compradas" on public.modules for select to authenticated
  using (
    (select public.is_admin())
    or product_id in (select e.product_id from public.entitlements e where e.email = (select lower(auth.jwt() ->> 'email')))
  );
drop policy if exists "admin escenas" on public.modules;
create policy "admin escenas" on public.modules for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Clases ----------
drop policy if exists "ver clases compradas" on public.lessons;
create policy "ver clases compradas" on public.lessons for select to authenticated
  using (
    (select public.is_admin())
    or module_id in (
      select m.id from public.modules m
      where m.product_id in (select e.product_id from public.entitlements e where e.email = (select lower(auth.jwt() ->> 'email')))
    )
  );
drop policy if exists "admin clases" on public.lessons;
create policy "admin clases" on public.lessons for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Accesos ----------
drop policy if exists "ver mis accesos" on public.entitlements;
create policy "ver mis accesos" on public.entitlements for select to authenticated
  using (email = (select lower(auth.jwt() ->> 'email')) or (select public.is_admin()));
drop policy if exists "admin accesos" on public.entitlements;
create policy "admin accesos" on public.entitlements for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Progreso y reels ----------
drop policy if exists "mi progreso" on public.progress;
create policy "mi progreso" on public.progress for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "marcar clase" on public.progress;
create policy "marcar clase" on public.progress for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "desmarcar clase" on public.progress;
create policy "desmarcar clase" on public.progress for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "mis reels" on public.reels;
create policy "mis reels" on public.reels for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists "subir reel" on public.reels;
create policy "subir reel" on public.reels for insert to authenticated with check (user_id = (select auth.uid()));

-- ---------- Novedades ----------
drop policy if exists "ver novedades" on public.updates;
create policy "ver novedades" on public.updates for select to authenticated
  using (
    product_id is null
    or (select public.is_admin())
    or product_id in (select e.product_id from public.entitlements e where e.email = (select lower(auth.jwt() ->> 'email')))
  );
drop policy if exists "admin novedades" on public.updates;
create policy "admin novedades" on public.updates for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- Certificados ----------
drop policy if exists "mis certificados" on public.certificates;
create policy "mis certificados" on public.certificates for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admin compras" on public.purchases;
create policy "admin compras" on public.purchases for select to authenticated using ((select public.is_admin()));

-- ---------- Índices que faltaban ----------
-- Accesos por producto (contar credenciales, buscar escenas compradas).
create index if not exists entitlements_product_idx on public.entitlements (product_id);
-- Novedades por producto y orden por fecha.
create index if not exists updates_product_idx on public.updates (product_id);
create index if not exists updates_published_idx on public.updates (published_at desc);
-- Clases de una escena en orden.
create index if not exists lessons_module_sort_idx on public.lessons (module_id, sort);

analyze public.entitlements, public.modules, public.lessons, public.updates;
