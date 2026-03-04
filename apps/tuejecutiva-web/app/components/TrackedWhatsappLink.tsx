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
const CONVERSION_TIMEOUT_MS = 1200

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

    event.preventDefault()

    const popup =
      target === '_blank'
        ? window.open('', '_blank', 'noopener,noreferrer')
        : null

    let didNavigate = false
    const navigate = () => {
      if (didNavigate) return
      didNavigate = true

      if (popup) {
        popup.location.href = href
        return
      }

      if (target === '_blank') {
        window.open(href, '_blank', 'noopener,noreferrer')
        return
      }

      window.location.href = href
    }

    if (typeof window.gtag === 'function') {
      const sendTo = conversionSendTo || DEFAULT_WHATSAPP_CONVERSION_SEND_TO

      window.gtag('event', 'conversion', {
        send_to: sendTo,
        value: CONVERSION_VALUE,
        currency: CONVERSION_CURRENCY,
        event_callback: navigate,
        event_timeout: CONVERSION_TIMEOUT_MS,
      })

      window.gtag('event', 'click_whatsapp', {
        contact_channel: 'whatsapp',
        destination: href,
      })

      setTimeout(navigate, CONVERSION_TIMEOUT_MS)
      return
    }

    navigate()
  }

  return <a {...props} href={href} target={target} rel={safeRel} onClick={handleClick} />
}
