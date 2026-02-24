import { SEO } from '../data/kumera-seo'

export const GET = () => {
  const pages = [
    {
      url: '/',
      priority: 1.0,
      changefreq: 'weekly'
    },
    {
      url: '/sitios-web',
      priority: 0.9,
      changefreq: 'weekly'
    },
    {
      url: '/google-ads',
      priority: 0.9,
      changefreq: 'weekly'
    },
    {
      url: '/ecommerce-shopify',
      priority: 0.9,
      changefreq: 'weekly'
    },
    {
      url: '/precios',
      priority: 0.85,
      changefreq: 'weekly'
    },
    {
      url: '/contacto',
      priority: 0.8,
      changefreq: 'monthly'
    },
    {
      url: '/apps-moviles',
      priority: 0.8,
      changefreq: 'monthly'
    }
  ]

  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${SEO.site.url}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
${urls}
</urlset>`

  return new Response(sitemap.trim(), {
    headers: {
      'Content-Type': 'application/xml'
    }
  })
}
