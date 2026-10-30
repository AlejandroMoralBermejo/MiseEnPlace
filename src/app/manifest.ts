import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MiseEnPlace',
    short_name: 'MiseEnPlace',
    description: 'Planificador de comidas familiares',
    lang: 'es',
    start_url: '/calendar',
    display: 'standalone',
    background_color: '#0f3440',
    theme_color: '#0f3440',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
