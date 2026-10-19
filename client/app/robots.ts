import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const production = process.env.VERCEL_ENV === 'production';
  return {
    rules: [
      { userAgent: '*', ...(production ? { allow: '/', disallow: '/api/' } : { disallow: '/' }) },
    ],
  };
}
