import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Security headers
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googletagmanager.com https://*.googlesyndication.com https://*.googleadservices.com https://*.clarity.ms https://*.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://*.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.google.com https://*.googleapis.com https://*.googlesyndication.com https://*.google-analytics.com https://*.clarity.ms https://*.cloudflareinsights.com https://*.doubleclick.net",
      "frame-src 'self' https://*.google.com https://*.googlesyndication.com https://*.doubleclick.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
});
