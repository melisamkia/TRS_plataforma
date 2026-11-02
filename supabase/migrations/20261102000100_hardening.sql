-- Ajustes de seguridad que pidió el revisor de Supabase.

-- search_path fijo en el trigger de accesos.
alter function public.prepare_entitlement() set search_path = public;

-- Las funciones de trigger no se llaman desde la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prepare_entitlement() from public, anon, authenticated;

-- Las usan los permisos (RLS) de las usuarias con sesión; sin sesión no hacen falta.
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.owns_product(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_product(uuid) to authenticated;
