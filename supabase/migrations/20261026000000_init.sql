-- El Set: esquema inicial.
-- Cada alumna ve solo lo que compró (según su mail en entitlements). Meli y Clari (is_admin) ven y editan todo.

-- ---------- Tablas ----------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tagline text not null default '',
  description text not null default '',
  kind text not null default 'curso' check (kind in ('programa', 'bonus', 'membresia', 'curso', 'servicio')),
  brand text not null default 'Meli & Clari',
  price_label text,
  checkout_url text,
  poster_style text not null default 'ink' check (poster_style in ('ink', 'orange', 'lime', 'paper')),
  listed boolean not null default true,
  coming_soon boolean not null default false,
  gamified boolean not null default false,
  includes uuid[] not null default '{}',
  sort int not null default 0,
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null,
  summary text not null default '',
  is_milestone boolean not null default false,
  sort int not null default 0
);
create index modules_product_idx on public.modules (product_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  description text not null default '',
  video_id text,
  duration text,
  resources jsonb not null default '[]'::jsonb,
  sort int not null default 0
);
create index lessons_module_idx on public.lessons (module_id);

-- Quién tiene acceso a qué. Se carga por mail (desde el admin o, más adelante, automático desde Beacons).
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  product_id uuid not null references public.products (id) on delete cascade,
  member_number int,
  founder boolean not null default false,
  created_at timestamptz not null default now(),
  unique (email, product_id)
);
create index entitlements_email_idx on public.entitlements (email);

create table public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  url text,
  created_at timestamptz not null default now()
);
create index reels_user_idx on public.reels (user_id);

create table public.updates (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  body text not null default '',
  published_at timestamptz not null default now()
);

-- ---------- Funciones ----------

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.owns_product(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.entitlements e
    where e.product_id = pid and e.email = lower(auth.jwt() ->> 'email')
  )
$$;

-- Perfil automático al crear la cuenta (primer login con enlace mágico)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mail en minúscula y número de credencial correlativo por producto
create or replace function public.prepare_entitlement()
returns trigger language plpgsql as $$
begin
  new.email := lower(trim(new.email));
  if new.member_number is null then
    perform pg_advisory_xact_lock(hashtext(new.product_id::text));
    select coalesce(max(member_number), 0) + 1 into new.member_number
    from public.entitlements where product_id = new.product_id;
  end if;
  return new;
end $$;

create trigger entitlements_prepare
  before insert on public.entitlements
  for each row execute function public.prepare_entitlement();

-- ---------- Permisos (RLS) ----------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.entitlements enable row level security;
alter table public.progress enable row level security;
alter table public.reels enable row level security;
alter table public.updates enable row level security;

-- Perfiles: cada una ve el suyo. Nadie se puede hacer admin sola.
create policy "perfil propio" on public.profiles for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "admin edita perfiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Productos: todas ven el catálogo (para la Cartelera). Solo admin edita.
create policy "ver productos" on public.products for select to authenticated using (true);
create policy "admin productos" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Escenas y clases: solo de lo que compraste.
create policy "ver escenas compradas" on public.modules for select to authenticated
  using (public.is_admin() or public.owns_product(product_id));
create policy "admin escenas" on public.modules for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "ver clases compradas" on public.lessons for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.modules m where m.id = module_id and public.owns_product(m.product_id))
  );
create policy "admin clases" on public.lessons for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Accesos: cada una ve los suyos. Solo admin da y quita.
create policy "ver mis accesos" on public.entitlements for select to authenticated
  using (email = lower(auth.jwt() ->> 'email') or public.is_admin());
create policy "admin accesos" on public.entitlements for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Progreso y reels: cada una el suyo.
create policy "mi progreso" on public.progress for select to authenticated using (user_id = auth.uid());
create policy "marcar clase" on public.progress for insert to authenticated with check (user_id = auth.uid());
create policy "desmarcar clase" on public.progress for delete to authenticated using (user_id = auth.uid());

create policy "mis reels" on public.reels for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "subir reel" on public.reels for insert to authenticated with check (user_id = auth.uid());

-- Novedades: las generales y las de lo que compraste.
create policy "ver novedades" on public.updates for select to authenticated
  using (product_id is null or public.owns_product(product_id) or public.is_admin());
create policy "admin novedades" on public.updates for all to authenticated using (public.is_admin()) with check (public.is_admin());
