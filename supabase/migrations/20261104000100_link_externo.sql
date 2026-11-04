-- Link de acceso externo: si el contenido de un producto vive en otra plataforma,
-- la tarjeta en "Tus accesos" abre ese link. Se puede correr más de una vez.

alter table public.products add column if not exists access_url text;

update public.products
set access_url = 'https://claribernasconi.app.clientclub.net/home'
where slug = 'b-rolls' and access_url is null;
