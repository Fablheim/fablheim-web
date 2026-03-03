import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_SITE_URL = 'https://fablheim.com';
const siteUrlRaw = process.env.VITE_SITE_URL || DEFAULT_SITE_URL;
const siteUrl = siteUrlRaw.endsWith('/') ? siteUrlRaw.slice(0, -1) : siteUrlRaw;
const lastmod = new Date().toISOString().split('T')[0];

const routes = [
  '/',
  '/how-it-works',
  '/pricing',
  '/roadmap',
  '/new-to-ttrpgs',
  '/srd',
  '/systems/dnd-5e',
  '/systems/pathfinder-2e',
  '/systems/fate-core',
  '/systems/daggerheart',
  '/blog',
];

const urlset = routes
  .map((route) => {
    const loc = `${siteUrl}${route}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`;

const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
fs.writeFileSync(outputPath, xml, 'utf8');
console.log(`Sitemap generated at ${outputPath}`);

