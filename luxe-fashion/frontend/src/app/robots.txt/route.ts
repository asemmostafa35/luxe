import { NextResponse } from "next/server";

export async function GET() {
  const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://zanefashion.com";
  const text = `User-agent: *
Allow: /

Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /profile/
Disallow: /auth/

Sitemap: ${BASE}/sitemap.xml
`;
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
