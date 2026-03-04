'use client'

import type { AnchorHTMLAttributes, MouseEvent } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const DEFAULT_WHATSAPP_CONVERSION_SEND_TO = 'AW-17932575934/4A10CL_B6vUbEL7J9eZC'
const CONVERSION_VALUE = 1.0
const CONVERSION_CURRENCY = 'CLP'

type TrackedWhatsappLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  conversionSendTo?: string
}

export default function TrackedWhatsappLink({
  href,
  target,
  rel,
  onClick,
  conversionSendTo,
  ...props
}: TrackedWhatsappLinkProps) {
  const safeRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || !href || href === '#') {
      return
    }

    if (typeof window.gtag === 'function') {
      const sendTo = conversionSendTo || DEFAULT_WHATSAPP_CONVERSION_SEND_TO

      window.gtag('event', 'conversion', {
        send_to: sendTo,
        value: CONVERSION_VALUE,
        currency: CONVERSION_CURRENCY,
      })

      window.gtag('event', 'click_whatsapp', {
        contact_channel: 'whatsapp',
        destination: href,
      })
    }
  }

  return <a {...props} href={href} target={target} rel={safeRel} onClick={handleClick} />
}
