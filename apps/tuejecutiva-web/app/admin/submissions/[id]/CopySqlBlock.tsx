"use client";

import { useState } from "react";

interface CopySqlBlockProps {
  sql: string;
}

export default function CopySqlBlock({ sql }: CopySqlBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">SQL para creación manual</h2>
      <p className="mt-2 text-sm text-amber-700">
        ⚠️ Recuerda revisar y ajustar el plan contratado antes de ejecutar este SQL.
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
      >
        Copiar SQL para creación manual
      </button>
      {copied ? (
        <div className="mt-2 text-xs font-semibold text-emerald-700">SQL copiado.</div>
      ) : null}
      <textarea
        readOnly
        className="mt-3 h-64 w-full rounded-md border border-gray-300 p-3 text-xs"
        value={sql}
      />
    </section>
  );
}
