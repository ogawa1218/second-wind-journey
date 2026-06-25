import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/news'],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/auth/',
          '/login',
          '/onboarding',
          '/api/',
          '/_next/',
          '/admin/',
          '/api/cron/',
          '/api/auth/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/'],
        disallow: ['/dashboard', '/api/'],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: 'https://mash-health.vercel.app/sitemap.xml',
  }
}
