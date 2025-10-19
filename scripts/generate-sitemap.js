#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUrl = process.env.VITE_APP_URL || 'https://wackyworksvr.com';

const pages = [
    { loc: '/', lastmod: new Date().toISOString().split('T')[0], priority: '1.0' },
    { loc: '/scenes/level-select.html', lastmod: new Date().toISOString().split('T')[0], priority: '0.9' },
    { loc: '/scenes/level.html', lastmod: new Date().toISOString().split('T')[0], priority: '0.8' },
    { loc: '/scenes/level-editor.html', lastmod: new Date().toISOString().split('T')[0], priority: '0.7' },
    { loc: '/scenes/physics-demo.html', lastmod: new Date().toISOString().split('T')[0], priority: '0.6' },
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
        .map(
            page => `  <url>
    <loc>${baseUrl}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <priority>${page.priority}</priority>
  </url>`
        )
        .join('\n')}
</urlset>
`;

const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
console.log('✅ Sitemap gerado com sucesso em dist/sitemap.xml');
