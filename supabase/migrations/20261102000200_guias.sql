-- Guías para leer, resumen abajo de cada video, ruta rápida y clases alternativas (Mac o Windows).
alter table public.lessons
  add column kind text not null default 'video' check (kind in ('video', 'guia')),
  add column body text not null default '',
  add column essential boolean not null default false,
  add column alt_group text;
