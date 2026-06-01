import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luxefashion.com';

async function getProducts(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/products?limit=500&sort=updatedAt&order=desc`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Array<{ slug: string }>> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${apiUrl}/categories`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const now = new Date().toISOString();

  const staticPages = [
    { url: '',               changefreq: 'daily',   priority: '1.0' },
    { url: '/shop',          changefreq: 'daily',   priority: '0.9' },
    { url: '/new-arrivals',  changefreq: 'daily',   priority: '0.9' },
    { url: '/best-sellers',  changefreq: 'weekly',  priority: '0.8' },
    { url: '/category',      changefreq: 'weekly',  priority: '0.8' },
    { url: '/about',         changefreq: 'monthly', priority: '0.5' },
    { url: '/contact',       changefreq: 'monthly', priority: '0.5' },
    { url: '/faq',           changefreq: 'monthly', priority: '0.5' },
    { url: '/privacy',       changefreq: 'yearly',  priority: '0.3' },
    { url: '/terms',         changefreq: 'yearly',  priority: '0.3' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${categories.map(c => `  <url>
    <loc>${BASE_URL}/category/${c.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
${products.map(p => `  <url>
    <loc>${BASE_URL}/product/${p.slug}</loc>
    <lastmod>${p.updatedAt || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
