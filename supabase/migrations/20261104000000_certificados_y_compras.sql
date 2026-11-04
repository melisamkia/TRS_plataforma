-- Certificados al terminar un producto, registro de compras automáticas y "solo entran las que compraron".

-- ---------- Certificados ----------

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  -- Código corto para verificar el certificado (va impreso y en el link de verificación).
  code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  full_name text not null,
  issued_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.certificates enable row level security;
-- Cada una ve los suyos; admin ve todos. Nadie inserta directo: solo con issue_certificate().
create policy "mis certificados" on public.certificates for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Emite (o corrige el nombre de) el certificado, solo si compró el producto y terminó todas sus clases.
create or replace function public.issue_certificate(pid uuid, name text)
returns public.certificates language plpgsql volatile security definer set search_path = public as $$
declare
  clean text := trim(regexp_replace(coalesce(name, ''), '\s+', ' ', 'g'));
  total int;
  pending int;
  cert public.certificates;
begin
  if auth.uid() is null then raise exception 'Tu sesión se cerró. Vuelve a entrar con tu mail.'; end if;
  if length(clean) < 2 or length(clean) > 80 then raise exception 'Escribe tu nombre como quieres que aparezca (hasta 80 letras).'; end if;
  if not public.owns_product(pid) then raise exception 'No tienes acceso a este producto.'; end if;

  select count(*), count(*) filter (where p.lesson_id is null) into total, pending
  from public.lessons l
  join public.modules m on m.id = l.module_id
  left join public.progress p on p.lesson_id = l.id and p.user_id = auth.uid()
  where m.product_id = pid;

  if total = 0 or pending > 0 then raise exception 'Te faltan clases por terminar para recibir el certificado.'; end if;

  insert into public.certificates (user_id, product_id, full_name) values (auth.uid(), pid, clean)
  on conflict (user_id, product_id) do update set full_name = excluded.full_name
  returning * into cert;

  update public.profiles set full_name = clean where id = auth.uid();
  return cert;
end $$;

revoke all on function public.issue_certificate(uuid, text) from public, anon;
grant execute on function public.issue_certificate(uuid, text) to authenticated;

-- Verificación pública: cualquiera con el código ve nombre, producto y fecha (nada más).
create or replace function public.verify_certificate(cert_code text)
returns table (full_name text, product_title text, issued_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.full_name, p.title, c.issued_at
  from public.certificates c join public.products p on p.id = c.product_id
  where c.code = upper(trim(cert_code))
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- ---------- Compras que llegan solas (función "compra") ----------

-- Cada aviso de venta que llega, tal cual, para revisar si algo no cuadra.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  email text,
  product_id uuid references public.products (id) on delete set null,
  status text not null check (status in ('ok', 'sin_mail', 'sin_producto', 'error')),
  detail text,
  source text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index purchases_created_idx on public.purchases (created_at desc);

alter table public.purchases enable row level security;
-- Solo admin las lee. Las escribe la función "compra" con la clave de servicio (que ignora RLS).
create policy "admin compras" on public.purchases for select to authenticated using (public.is_admin());

-- ---------- Solo pueden crear cuenta las que compraron ----------

-- Hook "Before User Created" de Supabase Auth. Se activa en Authentication → Hooks.
-- Deja crear la cuenta si el mail tiene al menos un acceso cargado. Las cuentas que ya existen no pasan por acá.
create or replace function public.hook_solo_compradoras(event jsonb)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  mail text := lower(trim(coalesce(event -> 'user' ->> 'email', '')));
begin
  if mail <> '' and exists (select 1 from public.entitlements where email = mail) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'No encontramos una compra con este mail. Usa el mismo mail con el que compraste. Si acabas de comprar, espera un par de minutos y prueba de nuevo.'
  ));
end $$;

revoke all on function public.hook_solo_compradoras(jsonb) from public, anon, authenticated;
grant execute on function public.hook_solo_compradoras(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.entitlements to supabase_auth_admin;
