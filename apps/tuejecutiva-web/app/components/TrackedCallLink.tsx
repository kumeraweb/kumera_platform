'use client'

import type { AnchorHTMLAttributes, MouseEvent } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

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
      window.gtag('event', 'click_to_call', {
        contact_channel: 'phone',
        destination: href,
        premium_conversion_configured: Boolean(conversionSendTo)
      })
    }
  }

  return <a {...props} href={href} target={target} rel={safeRel} onClick={handleClick} />
}
