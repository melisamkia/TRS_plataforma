// Estructura del curso The Reel Studio: escenas y piezas (videos y guías).
// Sale del plan del 29/10/2026 con los cambios de Meli del 02/11. `from` son los números de clase del plan original.

export interface PiezaSeed {
  kind: 'video' | 'guia'
  title: string
  description: string
  from: string[]
  /** Minutos aproximados del video. */
  min?: number
  /** Ruta rápida: lo mínimo para llegar a Directora. */
  essential?: boolean
  /** Alternativas: con terminar una alcanza. */
  alt?: string
}

export interface EscenaSeed {
  title: string
  summary: string
  /** Terminar su ruta rápida sube a Creadora. */
  milestone?: boolean
  pieces: PiezaSeed[]
}

const MAC_WIN = 'Mac o Windows'

export const CURSO_TRS: EscenaSeed[] = [
  {
    title: 'Bienvenida al set',
    summary: 'Quiénes somos, cómo funciona el studio y dónde pedir ayuda.',
    pieces: [
      { kind: 'video', title: 'Hola, somos Meli y Clari', description: 'Qué vas a lograr: tú grabas y el studio edita. Tres reels terminados para que veas adónde vas.', from: ['1.1'], min: 3, essential: true },
      { kind: 'video', title: 'El studio en 3 minutos', description: 'El recorrido entero: grabas, sueltas el video, apruebas el corte, eliges el diseño, revisas y publicas.', from: ['1.2'], min: 4, essential: true },
      { kind: 'guia', title: 'Cómo usar la plataforma', description: 'Escenas, videos y guías, cómo marcar lo que terminaste y cómo se sube de nivel.', from: ['1.3'] },
      { kind: 'guia', title: 'Súmate al grupo de soporte', description: 'El grupo de Telegram y qué mandar cuando te trabas: qué escribiste, una captura y si usas Mac o Windows.', from: ['1.4'] },
    ],
  },
  {
    title: 'Instalación',
    summary: 'Deja el studio funcionando en tu computadora.',
    milestone: true,
    pieces: [
      { kind: 'guia', title: 'Lo que necesitas antes de empezar', description: 'Mac o Windows, Claude Pro o superior, la app de escritorio y unos 10 GB libres. CapCut es opcional.', from: ['2.1'], essential: true },
      { kind: 'video', title: 'Instala Claude', description: 'Bajar la app de claude.com/download, entrar con tu cuenta y encontrar la pestaña Code.', from: ['2.2'], min: 4, essential: true },
      { kind: 'video', title: 'Instala tu studio en Mac', description: 'Descomprimir el ZIP en Películas (nunca en la nube), abrir la carpeta en la pestaña Code, escribir /configurar y preparar tu compu: el chequeo y Homebrew en la Terminal.', from: ['2.3', '2.4', '2.5'], min: 14, essential: true, alt: MAC_WIN },
      { kind: 'video', title: 'Instala tu studio en Windows', description: 'Descomprimir el ZIP en Videos (nunca en la nube), abrir la carpeta en la pestaña Code, escribir /configurar y preparar tu compu: la ventana de «permitir cambios» y por qué cerrar y abrir Claude después.', from: ['2.3', '2.4', '2.6'], min: 14, essential: true, alt: MAC_WIN },
      { kind: 'guia', title: 'Si algo no se instala', description: 'Volver a correr el chequeo, liberar espacio, sacar la carpeta de la nube y qué mandar al grupo.', from: ['2.7'] },
    ],
  },
  {
    title: 'Tu marca',
    summary: 'Tus colores, tus letras y tu voz, guardados una sola vez con /configurar.',
    pieces: [
      { kind: 'video', title: 'Personaliza tu Studio', description: '/configurar de punta a punta: quién eres y cómo hablas, tus colores, tus letras, tu voz, cómo arrancan tus reels, cuánto se editan, tu diseño favorito y tu tarjeta de marca.', from: ['3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.8'], min: 30, essential: true },
      { kind: 'guia', title: 'Extras para tus reels', description: 'GIFs (con la clave gratis de Giphy, paso a paso), música, logos reales de apps, emojis 3D, ritmo, sonidos y CapCut.', from: ['3.7'], essential: true },
    ],
  },
  {
    title: 'Tu studio por dentro',
    summary: 'La pantalla desde donde haces todo, sin escribir en el chat.',
    pieces: [
      { kind: 'video', title: 'Recorrido por Tu studio y el chat con Claude', description: 'La claqueta del día, «Seguir donde quedaste», «Soltá tu video», «En el set», «Tus reels» y el chat del costado con sus tarjetas.', from: ['4.1', '4.2'], min: 10, essential: true },
      { kind: 'guia', title: 'La Library', description: 'Qué hay en cada sección y cómo buscar un efecto para lo que quieres decir.', from: ['4.3'] },
      { kind: 'guia', title: 'Los avisos de Tu studio', description: 'Qué significan «Claude está cerrado» y «Tu studio está apagado», y cómo vuelve solo.', from: ['4.5'] },
    ],
  },
  {
    title: 'Grabación rápida',
    summary: 'Graba de corrido, con errores incluidos: el studio corta.',
    pieces: [
      { kind: 'video', title: 'Graba tu primer reel guiado', description: 'El guion de 40 segundos de «Pedilo mientras grabás»: cada frase pide un efecto y ves todo el studio en tu propia cara.', from: ['5.1'], min: 4, essential: true },
      { kind: 'video', title: 'Cómo grabar para el studio', description: 'Vertical, luz de frente, aire arriba y buen sonido. Si te trabas, repites la frase. Y cómo pedir efectos mientras grabas («Claude, zoom»).', from: ['5.2', '5.3', '5.4'], min: 12, essential: true },
      { kind: 'video', title: 'Graba varias semanas en una sesión', description: 'El método para grabar en bloque: guiones, cambios de ropa y en qué orden grabar.', from: ['5.5'], min: 6 },
      { kind: 'guia', title: 'Graba tu B-roll', description: 'Qué tomas grabar (manos, pantalla, casa, de 5 a 7 segundos) y el acceso al bonus B-Rolls Forever.', from: ['5.6'] },
    ],
  },
  {
    title: 'La edición',
    summary: 'De tu video crudo a tu reel publicado: el corte, las decisiones, los efectos y la revisión final.',
    pieces: [
      { kind: 'video', title: 'El corte', description: 'Soltar tu video, lo que el studio corta solo, la mesa de corte, tu hook, «Mostrar» en una frase, aprobar el corte y elegir tus subtítulos.', from: ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6'], min: 29, essential: true },
      { kind: 'video', title: 'Las 3 decisiones', description: 'Diseño (cómo se ve), plantilla (dónde estás tú y dónde van los gráficos) y nivel (cuánto se edita), y cuándo dejarle la decisión al studio.', from: ['7.1'], min: 5, essential: true },
      { kind: 'guia', title: 'Los 7 diseños del studio', description: 'Editorial Suave, Estudio Nocturno, Moodboard Dorado, Brillo de Cine, Cartel Rojo, Tiza Cálida y Recortes: cómo se ve cada uno y para qué video va.', from: ['7.2'] },
      { kind: 'guia', title: 'Las plantillas', description: 'Negocio, Pantallas detrás, Explicativo, Personal y Relato: dónde estás tú en cada una y cuál pide B-roll.', from: ['7.3'] },
      { kind: 'video', title: 'La Mesa de efectos', description: 'Cada momento con su clip real: notas, cambiar un efecto, «Sin efecto acá» y votar otras formas: Me encanta, Tal vez o Fuera.', from: ['7.4'], min: 8, essential: true },
      { kind: 'guia', title: 'Lo que revisa el studio antes de entregarte', description: 'La zona segura de Instagram, tu cara libre, el tamaño de las letras y la editora crítica. Por qué a veces frena el armado.', from: ['7.5'] },
      { kind: 'video', title: 'Revisión final y publica', description: 'Notas en el segundo exacto, «Enviar a Claude», el antes y ahora, «Aprobar», dónde queda tu video y el botón «Publiqué un reel».', from: ['7.6', '7.7'], min: 9, essential: true },
    ],
  },
  {
    title: 'Ajusta a tu gusto',
    summary: 'El control total desde el chat de Claude Code: pide cambios con tus palabras y con comandos.',
    pieces: [
      { kind: 'video', title: 'Ajusta tu reel desde Claude Code', description: '/ajustar, /efecto, /subtitulos y /revisar escritos en el chat, sobre el mismo reel: lo que Tu studio hace con botones, con más control.', from: ['8.1', '8.2', '8.3', '8.4'], min: 14 },
      { kind: 'video', title: 'Enséñale cómo te gusta', description: '/recordar, cómo aprende tu estilo de cada video y /laboratorio para comparar, votar y fijar tus reglas.', from: ['8.5', '8.6'], min: 9 },
      { kind: 'guia', title: 'Todos los comandos', description: 'La lista completa (escribe / en el chat para verla) y para qué sirve cada grupo.', from: ['4.4'] },
    ],
  },
  {
    title: 'Una grabación, toda la semana',
    summary: 'Del mismo reel salen tu carrusel y tu secuencia de historias.',
    pieces: [
      { kind: 'video', title: 'Tu carrusel y tu secuencia de historias', description: 'Del mismo reel: el carrusel (fijo o animado) y la secuencia de historias, con tu marca o con el diseño del reel.', from: ['9.1', '9.2'], min: 12 },
      { kind: 'video', title: 'Prueba hooks con Trial Reels', description: 'Versiones del mismo video con hooks distintos, cuándo subirlas y cómo leerlas a las 24 horas.', from: ['9.3'], min: 6 },
    ],
  },
  {
    title: 'Sin mostrar la cara',
    summary: 'Reels con poco material, o sin aparecer.',
    pieces: [
      { kind: 'video', title: 'Tu biblioteca de B-roll', description: '/broll: el studio mira tus clips, corta las mejores tomas y las etiqueta. Favoritas y «no usar».', from: ['10.1'], min: 6 },
      { kind: 'video', title: 'Voz en off y video animado', description: '/vozenoff con tus tomas o animaciones, y /animado: de un PDF, una web, un carrusel o una idea, con música.', from: ['10.3', '10.4'], min: 10 },
      { kind: 'guia', title: 'Reel de 7 segundos y GIF de reacción', description: '/reel-corto (una toma y un texto) y /gif (una frase y listo), con ejemplos.', from: ['10.2', '10.5'] },
    ],
  },
  {
    title: 'Tu propio diseño',
    summary: 'Inspírate en quien te gusta y arma un diseño que sea tuyo.',
    pieces: [
      { kind: 'video', title: 'Arma tu propio diseño', description: '/copiar-estilo para tomar la forma de la edición de otra creadora (nunca su contenido) y /inspiracion para armar tu diseño.', from: ['11.1', '11.2'], min: 12 },
      { kind: 'guia', title: 'Usa tu diseño en cada video', description: 'Cómo dejarlo de favorito y cambiarlo cuando quieras.', from: ['11.3'] },
    ],
  },
  {
    title: 'Toque final en CapCut',
    summary: 'Opcional, para quien quiera retocar a mano.',
    pieces: [
      { kind: 'video', title: 'Tu reel en CapCut', description: '/capcut: el video llega con cada cosa en su capa, y los retoques que vale la pena hacer a mano.', from: ['12.1', '12.2'], min: 10 },
    ],
  },
  {
    title: 'Tu studio al día',
    summary: 'Actualizaciones, tus carpetas y tu privacidad.',
    pieces: [
      { kind: 'guia', title: 'Actualiza tu studio y suma módulos', description: '/actualizar: dejas el .zip en la carpeta entrada y el studio hace el resto.', from: ['13.1'] },
      { kind: 'guia', title: 'Dónde está cada cosa', description: 'entrada, proyectos (con tu video en final), mi-marca y mi-b-roll. Qué es tuyo y nunca se toca al actualizar.', from: ['13.2'] },
      { kind: 'guia', title: 'Tu privacidad', description: 'Tus videos se quedan en tu compu. Qué lee Claude y qué no.', from: ['13.3'] },
    ],
  },
]
