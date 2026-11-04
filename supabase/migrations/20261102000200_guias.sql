-- Guías para leer, resumen abajo de cada video, ruta rápida y clases alternativas (Mac o Windows).
-- Se puede correr más de una vez: lo que ya existe no se toca.
alter table public.lessons
  add column if not exists kind text not null default 'video' check (kind in ('video', 'guia')),
  add column if not exists body text not null default '',
  add column if not exists essential boolean not null default false,
  add column if not exists alt_group text;
