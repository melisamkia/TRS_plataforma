// LECTOR DE VENTAS DE BEACONS (Google Apps Script, gratis, corre en la cuenta de Gmail que recibe las ventas).
//
// Cada 5 minutos busca los mails "You just made a sale" de Beacons, saca el mail de la compradora y el
// producto, y avisa a la plataforma (función "compra" de Supabase), que le da el acceso sola.
//
// Instalación (una sola vez, en el Gmail de Clari):
//   1. Entrar a https://script.google.com con esa cuenta → "Nuevo proyecto". Ponerle de nombre "Ventas Beacons".
//   2. Borrar lo que aparece y pegar TODO este archivo. Guardar (ícono del disquete).
//   3. Engranaje "Configuración del proyecto" → abajo, "Propiedades de la secuencia de comandos" → Agregar:
//        Propiedad: COMPRA_URL
//        Valor:     https://<proyecto>.supabase.co/functions/v1/compra?clave=<COMPRA_CLAVE>
//   4. Volver a "Editor" (<>), elegir la función "instalar" arriba y tocar "Ejecutar". Google pide permiso para
//      leer el Gmail: "Revisar permisos" → elegir la cuenta → "Configuración avanzada" → "Ir a Ventas Beacons" → Permitir.
//   Listo. Para probar con las ventas de los últimos días: elegir "procesarAhora" y "Ejecutar"; el resultado se ve
//   en "Registro de ejecución" y en la plataforma, Admin → Alumnas y accesos → "Compras automáticas".

// Productos: si el detalle de la venta dice el texto de la izquierda, se da acceso al producto de la derecha
// (el "slug" del producto en la plataforma). Para sumar uno, agregar una línea.
var PRODUCTOS = [
  { dice: 'THE REEL STUDIO', producto: 'the-reel-studio' },
]

// Si el detalle dice alguno de estos textos, la compradora queda como Fundadora.
var FUNDADORA_SI_DICE = ['PRE LANZAMIENTO', 'PRELANZAMIENTO', 'PRE-LANZAMIENTO', 'PREVENTA']

// Qué mails mirar.
var BUSQUEDA = 'from:beacons.ai newer_than:3d'
var ASUNTO_VENTA = /made (a|an affiliate) sale/i

/** Lee un mail de venta de Beacons. Devuelve null si no es una venta o no trae el mail de la compradora. */
function leerVenta(asunto, texto) {
  if (!ASUNTO_VENTA.test(asunto || '')) return null
  var t = String(texto || '')
    .replace(/<[^>]+>/g, ' ') // por si viene en HTML
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/mailto:/gi, ' ')
  var m = t.match(/customer\s*email[\s:]*\[?\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
  if (!m) return null
  var arriba = t.toUpperCase().replace(/\s+/g, ' ')
  var producto = null
  for (var i = 0; i < PRODUCTOS.length; i++) {
    if (arriba.indexOf(PRODUCTOS[i].dice.toUpperCase()) !== -1) {
      producto = PRODUCTOS[i].producto
      break
    }
  }
  var fundadora = FUNDADORA_SI_DICE.some(function (x) {
    return arriba.indexOf(x) !== -1
  })
  var pedido = t.match(/order\s*#[\s:]*([0-9a-f-]{8,})/i)
  return { email: m[1].toLowerCase(), producto: producto, fundadora: fundadora, pedido: pedido ? pedido[1] : null }
}

/** Busca ventas nuevas y avisa a la plataforma. La corre el reloj cada 5 minutos. */
function procesarAhora() {
  var url = PropertiesService.getScriptProperties().getProperty('COMPRA_URL')
  if (!url) throw new Error('Falta la propiedad COMPRA_URL (ver instrucciones arriba).')
  var props = PropertiesService.getScriptProperties()
  var hechos = JSON.parse(props.getProperty('PROCESADOS') || '[]')
  var nuevos = 0

  GmailApp.search(BUSQUEDA, 0, 50).forEach(function (hilo) {
    hilo.getMessages().forEach(function (msj) {
      var id = msj.getId()
      if (hechos.indexOf(id) !== -1) return
      var venta = leerVenta(msj.getSubject(), msj.getPlainBody() || msj.getBody())
      if (venta) {
        var res = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({
            email: venta.email,
            producto: venta.producto || '',
            fundadora: venta.fundadora ? '1' : '0',
            pedido: venta.pedido,
            origen: 'beacons-gmail',
          }),
          muteHttpExceptions: true,
        })
        // Si la plataforma no respondió bien (clave mal copiada, Supabase caído), se reintenta en la próxima vuelta.
        if (res.getResponseCode() !== 200) {
          console.log('No se pudo avisar (' + res.getResponseCode() + '), se reintenta: ' + venta.email + ' · ' + res.getContentText())
          return
        }
        console.log('Venta: ' + venta.email + ' · ' + (venta.producto || 'producto sin reconocer') + ' → ' + res.getContentText())
        nuevos++
      }
      hechos.push(id)
    })
  })

  props.setProperty('PROCESADOS', JSON.stringify(hechos.slice(-800)))
  console.log(nuevos + ' venta(s) nueva(s).')
}

/** Correr una sola vez: activa el reloj de cada 5 minutos. */
function instalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'procesarAhora') ScriptApp.deleteTrigger(t)
  })
  ScriptApp.newTrigger('procesarAhora').timeBased().everyMinutes(5).create()
  procesarAhora()
  console.log('Listo: revisa las ventas de Beacons cada 5 minutos.')
}
