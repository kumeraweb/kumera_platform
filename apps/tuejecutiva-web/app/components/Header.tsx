'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const links = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/#como-funciona', label: '¿Cómo funciona?' },
  { href: '/soy-ejecutiva', label: 'Soy Ejecutiva' }
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (!open) return
      const target = event.target as Node
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('click', onDocumentClick)
    return () => document.removeEventListener('click', onDocumentClick)
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo/logonbg.png"
              alt="TuEjecutiva.cl"
              className="h-10 w-auto object-contain"
              width={160}
              height={40}
              priority
            />
          </Link>
        </div>

        <nav className="hidden md:flex gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex md:hidden">
          <button
            ref={buttonRef}
            className="text-slate-600 hover:text-emerald-600 p-2"
            aria-label="Toggle menu"
            onClick={(event) => {
              event.stopPropagation()
              setOpen((value) => !value)
            }}
          >
            <Menu className={`w-6 h-6 transition-transform ${open ? 'hidden' : ''}`} />
            <X className={`w-6 h-6 transition-transform ${open ? '' : 'hidden'}`} />
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        className={`${open ? '' : 'hidden'} md:hidden absolute top-16 left-0 w-full bg-white border-b border-gray-100 shadow-lg origin-top transition-all duration-300 ease-in-out`}
      >
        <div className="flex flex-col p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-4 py-3 text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
