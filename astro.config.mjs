import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.rom.kr',
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/themes/') })],
});
