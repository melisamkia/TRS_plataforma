-- Mail de bienvenida: cuándo se le mandó a cada acceso. Vacío = todavía no se mandó.
-- Todas las que ya compraron quedan pendientes: se les manda desde Admin → Alumnas y accesos → "Mandar bienvenida".
-- Se puede correr más de una vez.

alter table public.entitlements add column if not exists welcome_sent_at timestamptz;
