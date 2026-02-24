'use client'

import type { AnchorHTMLAttributes, MouseEvent } from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type TrackedWhatsappLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string
}

export default function TrackedWhatsappLink({
  href,
  target,
  rel,
  onClick,
  ...props
}: TrackedWhatsappLinkProps) {
  const safeRel = target === '_blank' ? (rel ?? 'noopener noreferrer') : rel

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || !href || href === '#') {
      return
    }

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'click_whatsapp', {
        contact_channel: 'whatsapp',
        destination: href
      })
    }
  }

  return <a {...props} href={href} target={target} rel={safeRel} onClick={handleClick} />
}
