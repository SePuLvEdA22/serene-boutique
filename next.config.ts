import type { NextConfig } from "next";

// CSP por entorno: 'unsafe-eval' solo en desarrollo (HMR de Turbopack lo
// requiere). En producción se sirve una política más estricta.
const isDev = process.env.NODE_ENV === "development";

const scriptSrc = isDev
  ? "'self' 'unsafe-eval' 'unsafe-inline' https://mercadopago.com https://*.mercadopago.com"
  : "'self' https://mercadopago.com https://*.mercadopago.com";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://api.mercadopago.com",
  "frame-src 'self' https://mercadopago.com https://*.mercadopago.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  // Raíz del repo: evita que Turbopack suba al directorio padre y encuentre
  // un pnpm-workspace.yaml ajeno al proyecto (warning de workspace externo).
  turbopack: {
    root: process.cwd(),
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },

  async headers() {
    return [
      {
        // Única fuente de verdad de security headers (Vercel los aplica igual;
        // vercel.json no duplica nada para evitar drift).
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Content-Security-Policy",
            value: `${contentSecurityPolicy};`,
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
