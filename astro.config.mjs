import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.rom.kr',
  // Cached Pages documents must retain their styles across deployments.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap({ filter: (page) => {
    const { pathname } = new URL(page);
    return pathname !== '/blog/' && pathname !== '/login/' && !pathname.startsWith('/themes/');
  } })],
});
