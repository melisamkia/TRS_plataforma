// Prueba el lector de mails de Beacons (scripts/beacons-gmail.js, que corre en Google Apps Script).
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

type Venta = { email: string; producto: string | null; fundadora: boolean; pedido: string | null } | null
const ctx: { leerVenta?: (asunto: string, texto: string) => Venta } = {}
runInNewContext(readFileSync(new URL('./beacons-gmail.js', import.meta.url), 'utf8') + '\nthis.leerVenta = leerVenta', ctx)
const leer = ctx.leerVenta!

// Así llega el texto plano del mail de Beacons (datos inventados).
const AFILIADA = `AFFILIATE SALE
You just made an affiliate sale for $38.50!
Congrats, you earned commission!
View order details <https://beacons.ai/orders>
ORDER
DESCRIPTION AMOUNT
THE REEL STUDIO ( PRE LANZAMIENTO) $77.00
Total $38.50
AFFILIATE ORDER SUMMARY
CUSTOMER EMAIL
compradora.prueba@gmail.com <mailto:compradora.prueba@gmail.com>
COMMISSION RATE
50.0%
ORDER DATE
November 02, 2026
ORDER #
5087de0a-b3e8-48c2-b544-d7ff1b9da3c9
ORIGINAL SELLER
@vendedora`

describe('lector de ventas de Beacons', () => {
  it('lee la venta de afiliada: mail, producto, fundadora y pedido', () => {
    expect(leer('You just made a sale for $38.50', AFILIADA)).toEqual({
      email: 'compradora.prueba@gmail.com',
      producto: 'the-reel-studio',
      fundadora: true,
      pedido: '5087de0a-b3e8-48c2-b544-d7ff1b9da3c9',
    })
  })

  it('lee la venta normal, también si viene en HTML', () => {
    const html = '<td>The Reel Studio</td><td>$97.00</td><tr><td>Customer Email</td><td><a href="mailto:Otra@Mail.com">Otra@Mail.com</a></td></tr>'
    expect(leer('You just made a sale for $97.00', html)).toMatchObject({ email: 'otra@mail.com', producto: 'the-reel-studio', fundadora: false })
  })

  it('ignora los mails de Beacons que no son ventas', () => {
    expect(leer('Your weekly Beacons summary', AFILIADA)).toBeNull()
    expect(leer('You just made a sale for $10', 'sin mail de compradora')).toBeNull()
  })

  it('producto desconocido: igual manda el mail para que quede registrado', () => {
    expect(leer('You just made a sale for $10', 'OTRO CURSO Customer email: a@b.co')).toMatchObject({ email: 'a@b.co', producto: null })
  })
})
