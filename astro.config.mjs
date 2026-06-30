import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// JavaJub — RU Java interview-prep site. Static-first for max Yandex indexability.
const BUILD_DATE = new Date().toISOString();

export default defineConfig({
  site: 'https://www.javajub.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        const p = item.url.replace('https://www.javajub.com', '');
        if (p === '/') item.priority = 1.0;
        else if (/^\/(guides|companies|napravleniya)\/$/.test(p)) item.priority = 0.9;
        else if (/^\/(companies|guides|questions|napravleniya|themes)\//.test(p)) item.priority = 0.8;
        else item.priority = 0.6;
        item.lastmod = BUILD_DATE;
        return item;
      },
    }),
  ],
});
