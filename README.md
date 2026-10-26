# El Set · Meli & Clari

La plataforma de miembros de The Reel Studio y del resto de los productos de Meli y Clari. Cada alumna entra con su mail (sin contraseña) y ve:

- **Tus accesos**: los productos que compró (The Reel Studio, B-Rolls y lo que compre después).
- **Seguir donde quedaste**: la próxima clase que le falta.
- **Novedades**: las actualizaciones del sistema, con fecha.
- **En cartelera**: los otros productos que puede comprar, como afiches de cine.

Dentro de The Reel Studio hay niveles (Aprendiz, Creadora, Directora, Estrella), una credencial numerada de fundadora y una tira de película que se llena a medida que avanza. Se sube de nivel haciendo, no mirando: terminar la instalación y publicar reels.

## Probarla

```bash
npm install
npm run dev
```

Sin configurar nada arranca en **modo demo**: contenido de ejemplo guardado en el navegador, con el admin habilitado. Para volver al contenido original: Admin → "Volver al contenido de ejemplo".

Otros comandos: `npm test` (pruebas), `npm run typecheck`, `npm run build`.

## Palabras que usa la plataforma

| En la plataforma | Qué es |
| --- | --- |
| Escena | Un módulo (ej: Instalación, Tu estilo) |
| Clase | Un video dentro de una escena |
| Credencial | El número de alumna. Las de preventa dicen "Fundadora" |
| Niveles | Aprendiz → Creadora (terminó la instalación) → Directora (primer reel) → Estrella (4 reels) |
| En cartelera | La galería de otros productos |

Los niveles, los reels necesarios y los textos de ayuda se cambian en `src/config.ts`.

## Ponerla en vivo

### 1. Supabase (base de datos y login)

1. Crear un proyecto en Supabase.
2. En SQL Editor, correr `supabase/migrations/20261026000000_init.sql` y después `supabase/seed.sql` (el contenido inicial).
3. Authentication → URL Configuration: poner la dirección de la plataforma en **Site URL** y en **Redirect URLs**.
4. Authentication → Email Templates: traducir el mail del enlace mágico al español.
5. Entrar una vez a la plataforma con tu mail y después, en SQL Editor:
   ```sql
   update public.profiles set is_admin = true where email in ('mail-de-meli', 'mail-de-clari');
   ```

### 2. Bunny Stream (videos)

1. Crear una biblioteca en Bunny Stream y subir los videos.
2. En la biblioteca → Security: activar **Embed view token authentication** y poner el dominio de la plataforma en los dominios permitidos. Así los videos no se pueden ver fuera de El Set.
3. En Supabase → Edge Functions → Secrets, cargar `BUNNY_LIBRARY_ID` y `BUNNY_TOKEN_KEY`.
4. Publicar la función: `supabase functions deploy video-token`.
5. En Admin → Escenas y clases, pegar el "Video ID" de cada clase.

### 3. Netlify (la página)

1. Nuevo sitio desde este repositorio. Netlify lee `netlify.toml` solo.
2. Variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API).

### 4. Dar acceso a las compradoras

Admin → Alumnas y accesos: pegar los mails o el CSV de ventas de Beacons, elegir The Reel Studio (B-Rolls se suma solo) y marcar "Fundadora" para las de preventa.

## Falta definir

- **Link del grupo de Telegram**: completar `TELEGRAM_URL` en `src/config.ts`.
- **Accesos automáticos desde Beacons**: hay que confirmar si Beacons avisa cada venta (webhook). Mientras tanto, los accesos se cargan desde el admin.
- **Links de compra** de los productos de la Cartelera: se cargan en Admin → Productos.
- Para la versión 2: muro de reels de la comunidad, racha de semanas publicando, certificado al terminar y resumen mensual.

## Carpetas

```
src/config.ts            nombres, niveles, preguntas frecuentes, link de Telegram
src/lib/data/seed.ts     contenido de ejemplo (y fuente de supabase/seed.sql)
src/lib/data/            conexión con Supabase y modo demo
src/pages/               pantallas de alumna
src/pages/admin/         panel de admin
supabase/migrations/     tablas y permisos (cada alumna ve solo lo que compró)
supabase/functions/      link firmado de los videos de Bunny
```

Si cambiás el contenido de ejemplo en `seed.ts`, regenerá el SQL con `npm run seed:sql`.
