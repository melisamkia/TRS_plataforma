-- Latido diario para que Supabase no pause el proyecto del plan gratis por inactividad.
-- Lo llama todos los días la acción de GitHub "Mantener Supabase activo" (.github/workflows/supabase-keep-alive.yml).

create table public.heartbeat (
  id int primary key default 1 check (id = 1),
  last_ping timestamptz not null default now(),
  pings bigint not null default 0
);
insert into public.heartbeat (id) values (1);

-- Sin políticas: nadie lee ni escribe la tabla directo, solo a través de keep_alive().
alter table public.heartbeat enable row level security;

create or replace function public.keep_alive()
returns timestamptz language sql volatile security definer set search_path = public as $$
  update public.heartbeat set last_ping = now(), pings = pings + 1 where id = 1 returning last_ping;
$$;

revoke all on function public.keep_alive() from public;
grant execute on function public.keep_alive() to anon, authenticated;
