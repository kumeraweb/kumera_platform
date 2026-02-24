import type { APIRoute } from 'astro'
import { clearPanelSessionCookie } from '../../../lib/server/panel-auth'
import { rejectUntrustedOrigin } from '../../../lib/server/security'

export const POST: APIRoute = async (context) => {
  const originError = rejectUntrustedOrigin(context)
  if (originError) return originError

  clearPanelSessionCookie(context.cookies)

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}
