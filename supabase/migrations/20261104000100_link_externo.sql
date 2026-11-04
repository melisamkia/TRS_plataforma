-- Link de acceso externo: si el contenido de un producto vive en otra plataforma,
-- la tarjeta en "Tus accesos" abre ese link. Se puede correr más de una vez.

alter table public.products add column if not exists access_url text;

update public.products
set access_url = 'https://claribernasconi.app.clientclub.net/home'
where slug = 'b-rolls' and access_url is null;

-- The Reel Studio incluye B-Rolls Forever (por si en la base quedó sin sumar).
update public.products
set includes = array_append(includes, (select id from public.products where slug = 'b-rolls'))
where slug = 'the-reel-studio'
  and exists (select 1 from public.products where slug = 'b-rolls')
  and not ((select id from public.products where slug = 'b-rolls') = any (includes));
