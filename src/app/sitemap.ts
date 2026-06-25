import type { MetadataRoute } from 'next'

const BASE_URL = 'https://mash-health.vercel.app'

const CATEGORY_SLUGS = [
  'marathon-training',
  'sleep-recovery',
  'weight-management',
  'sports-nutrition',
  'running-tech',
  'habit-mindset',
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/news`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = CATEGORY_SLUGS.map((slug) => ({
    url: `${BASE_URL}/news/${slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...categoryRoutes]
}
