'use client'

import type { AnchorHTMLAttributes, MouseEvent } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const DEFAULT_CALL_CONVERSION_SEND_TO = 'AW-17932575934/2s7tCIKl9_UbEL7J9eZC'
const CONVERSION_VALUE = 1.0
const CONVERSION_CURRENCY = 'CLP'

type TrackedCallLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
  conversionSendTo?: string
}

export default function TrackedCallLink({
  href,
  target,
  rel,
  onClick,
  conversionSendTo,
  ...props
}: TrackedCallLinkProps) {
  const safeRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || !href || href === '#') {
      return
    }

    if (typeof window.gtag === 'function') {
      const sendTo = conversionSendTo || DEFAULT_CALL_CONVERSION_SEND_TO

      window.gtag('event', 'conversion', {
        send_to: sendTo,
        value: CONVERSION_VALUE,
        currency: CONVERSION_CURRENCY,
      })

      window.gtag('event', 'click_to_call', {
        contact_channel: 'phone',
        destination: href,
        premium_conversion_configured: Boolean(conversionSendTo),
      })
    }
  }

  return <a {...props} href={href} target={target} rel={safeRel} onClick={handleClick} />
}
