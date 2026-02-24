export const contact = {
  email: 'contacto@kumeraweb.com',
  phone: '+56994186218',
  whatsapp: {
    phone: '+56994186218',

    messages: {
      default: 'Hola, me gustaría hablar sobre un proyecto.'
    }
  },
  address: 'Región Metropolitana, Santiago Chile | Región del Bio Bío, Concepción'
}

export const getWhatsAppUrl = (message: string) => {
  const phoneDigits = contact.whatsapp.phone.replace(/\D/g, '')
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`
}
