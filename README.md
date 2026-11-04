# The Reel Studio · Plataforma

La plataforma de miembros (concepto "El Set") de The Reel Studio y del resto de los productos de Meli y Clari. Cada alumna entra con su mail (sin contraseña) y ve:

- **Tus accesos**: los productos que compró (The Reel Studio, B-Rolls y lo que compre después).
- **Seguir donde quedaste**: la próxima clase que le falta.
- **Novedades**: las actualizaciones del sistema, con fecha.
- **En cartelera**: los otros productos que puede comprar, como afiches de cine.

Al terminar todas las clases de un producto se desbloquea el **certificado**: la alumna escribe su nombre, lo descarga en PDF y tiene un link público (`/verificar/CÓDIGO`) para compartirlo y que cualquiera compruebe que es real.

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
| Escena | Un módulo (ej: Instalación, La edición) |
| Video | Una clase grabada, con un resumen o mini guía abajo |
| Guía | Una clase para leer: pasos, listas e imágenes |
| Ruta rápida | Lo mínimo para llegar a Directora. Las alumnas la pueden filtrar |
| Alternativa | Piezas donde alcanza con hacer una (ej: Mac o Windows) |
| Credencial | El número de alumna. Las de preventa dicen "Fundadora" |
| Niveles | Aprendiz → Creadora (terminó la ruta rápida de Instalación) → Directora (primer reel) → Estrella (4 reels) |
| En cartelera | La galería de otros productos |

Los niveles, los reels necesarios y los textos de ayuda se cambian en `src/config.ts`.

## Ponerla en vivo

### 1. Supabase (base de datos y login)

1. Crear un proyecto en Supabase.
2. En SQL Editor, correr los archivos de `supabase/migrations/` en orden de nombre y al final `supabase/seed.sql` (el contenido inicial). En el proyecto actual ya están corridos.
3. Authentication → URL Configuration: poner la dirección de la plataforma en **Site URL** y en **Redirect URLs**.
4. Authentication → Email Templates: traducir el mail del enlace mágico al español.
5. **Solo entran las que compraron**: Authentication → Hooks → "Before User Created" → tipo Postgres → función `public.hook_solo_compradoras`. Desde ahí, un mail sin compra cargada no puede crear cuenta (las cuentas que ya existen, como las de admin, siguen entrando).
6. Entrar una vez a la plataforma con tu mail y después, en SQL Editor:
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

1. Entrar a https://app.netlify.com con la cuenta de GitHub. Si en "Sites" no aparece la plataforma, todavía no está conectada: **Add new site → Import an existing project → GitHub → `TRS_plataforma`**. Netlify lee `netlify.toml` solo.
2. Site configuration → Environment variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API). Después: Deploys → Trigger deploy.
3. La dirección queda tipo `algo.netlify.app` (se cambia en Domain management). Esa dirección va en Supabase → Authentication → URL Configuration.

**Actualizaciones solas**: cada vez que se suben cambios a la rama `main` de GitHub, Netlify publica la versión nueva sola (1–2 minutos). Las alumnas que tienen la plataforma abierta no tienen que hacer nada: la app se da cuenta sola (revisa cada 5 minutos y al volver a la pestaña), muestra "Hay una versión nueva" y se actualiza al pasar a otra pantalla. El contenido (clases, novedades, accesos) no necesita publicar nada: se cambia desde el Admin y se ve al instante.

### 4. Dar acceso a las compradoras

**A mano**: Admin → Alumnas y accesos: pegar los mails o el CSV de ventas de Beacons, elegir The Reel Studio (B-Rolls se suma solo) y marcar "Fundadora" para las de preventa.

**Automático (función `compra`)**: recibe el aviso de cada venta y carga el acceso sola. Cada aviso queda en Admin → Alumnas y accesos → "Compras automáticas".

1. Supabase → Edge Functions → Secrets: cargar `COMPRA_CLAVE` (una clave larga inventada, ej. 30 letras y números al azar).
2. Publicarla: `supabase functions deploy compra --no-verify-jwt`.
3. La dirección del aviso es (una por producto):
   ```
   https://<proyecto>.supabase.co/functions/v1/compra?clave=<COMPRA_CLAVE>&producto=the-reel-studio
   ```
   Para la preventa sumar `&fundadora=1`. El mail de la compradora lo encuentra solo en lo que llegue.
4. Conectar quién avisa (Beacons cobra con Stripe y PayPal; Beacons no manda avisos propios):
   - **Stripe**: Stripe → Developers → Webhooks → Add endpoint → pegar la dirección → eventos `checkout.session.completed` y `charge.succeeded`.
   - **PayPal**: PayPal → Configuración de la cuenta → Notificaciones → Notificaciones instantáneas de pago (IPN) → pegar la dirección y activarlas.
   - Los reembolsos y pagos pendientes se ignoran solos. Ojo: avisan todas las ventas de esa cuenta, así que sirve mientras se venda un solo producto ahí.
5. Probarla: hacer una compra de prueba (o mandar el POST desde Zapier) y mirar "Compras automáticas" en el admin.

### 5. Que no se pause (plan gratis)

Supabase pausa los proyectos gratis después de una semana sin actividad. La acción de GitHub `Mantener Supabase activo` (`.github/workflows/supabase-keep-alive.yml`) le escribe a la base una vez por día para evitarlo.

1. En GitHub: Settings → Secrets and variables → Actions → New repository secret. Cargar `SUPABASE_URL` y `SUPABASE_ANON_KEY` (la clave publishable o anon del proyecto).
2. Probarla: pestaña Actions → "Mantener Supabase activo" → Run workflow. Tiene que terminar en verde.
3. Si alguna vez falla, GitHub te avisa por mail. En Supabase, la tabla `heartbeat` muestra el último latido.

## Falta definir

- **Quién avisa las ventas**: elegir Stripe o Zapier/Make (ver paso 4) según cómo cobra Beacons.
- **Links de compra** de los productos de la Cartelera: se cargan en Admin → Productos.
- Para la versión 2: muro de reels de la comunidad, racha de semanas publicando y resumen mensual.

## Carpetas

```
src/config.ts            nombres, niveles, preguntas frecuentes, link de Telegram
src/lib/data/curso-trs.ts  escenas y piezas de The Reel Studio
src/lib/data/seed.ts     contenido de la demo (y fuente de supabase/seed.sql)
src/lib/data/            conexión con Supabase y modo demo
src/pages/               pantallas de alumna
src/pages/admin/         panel de admin
supabase/migrations/     tablas y permisos (cada alumna ve solo lo que compró)
supabase/functions/      video-token (link firmado de Bunny) y compra (accesos automáticos)
```

Si cambiás `curso-trs.ts` o `seed.ts`, regenerá el SQL con `npm run seed:sql`. Para pasar el curso a un proyecto que ya tiene datos, se corre `supabase/curso-trs.sql` (reemplaza las escenas de The Reel Studio y borra el progreso de esas clases).
