import createNextIntlPlugin from 'next-intl/plugin';

// El plugin de next-intl carga la configuración de mensajes por petición
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Imágenes servidas desde el CDN de Sanity
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io' }],
  },
};

export default withNextIntl(nextConfig);
