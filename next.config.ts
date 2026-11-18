import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const internalHost = process.env.TAURI_DEV_HOST || 'localhost'

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  // Asegurate de que Next.js usa SSG en lugar de SSR
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  output: 'export',
  // Nota: Esta función es necesaria para usar el componente Image de Next.js en modo SSG.
  // Consulta https://nextjs.org/docs/messages/export-image-api para ver algunas soluciones alternativas.
  images: {
    unoptimized: true,
  },
  // Configura assetPrefix; de lo contrario, el servidor no resolverá correctamente tus recursos.
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
}

export default nextConfig
