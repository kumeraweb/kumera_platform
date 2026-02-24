import type { APIRoute } from 'astro'
import { requirePanelSession } from '../../../lib/server/panel-auth'

export const GET: APIRoute = async (context) => {
  const isAuthenticated = await requirePanelSession(context)
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ error: 'No autenticado.' }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  }

  return new Response(JSON.stringify({ user: { id: 'panel' } }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}
