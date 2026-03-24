import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BLOCKED_DOMAINS = [
  'unsplash.com', 'freepik.com', 'shutterstock.com', 'istockphoto.com',
  'gettyimages.com', 'stock.adobe.com', 'pexels.com', 'pixabay.com',
  'depositphotos.com', 'dreamstime.com', 'picsum.photos', '123rf.com',
  'vectorstock.com', 'canva.com', 'flaticon.com',
];

const BLOCKED_PATTERNS = ['logo', 'brand', 'banner', 'icon', 'avatar', 'placeholder', 'favicon', 'sprite'];

function isBlocked(url) {
  const l = url.toLowerCase();
  return BLOCKED_DOMAINS.some(d => l.includes(d)) || BLOCKED_PATTERNS.some(p => l.includes(p));
}

function downloadImage(imgUrl, destPath) {
  return new Promise((resolve) => {
    const proto = imgUrl.startsWith('https') ? https : http;
    const req = proto.get(imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 12000
    }, (res) => {
      if ([301, 302, 303, 307].includes(res.statusCode) && res.headers.location) {
        downloadImage(res.headers.location, destPath).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(false); return; }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (buf.length > 3000) {
          fs.ensureDirSync(path.dirname(destPath));
          fs.writeFileSync(destPath, buf);
          resolve(true);
        } else resolve(false);
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function searchGoogleImages(page, query, count = 5) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=itp:news`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 2000));

  const images = await page.evaluate(() => {
    const results = [];
    // Google Images puts data in img tags
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('data-src') || '';
      if (src.startsWith('http') && !src.includes('google.com') && !src.includes('gstatic.com') && src.length > 50) {
        results.push({ url: src, title: img.alt || '' });
      }
    });
    // Also try to get full-size URLs from data attributes
    document.querySelectorAll('[data-tbnid]').forEach(el => {
      const a = el.querySelector('a');
      if (a && a.href) {
        const imgEl = el.querySelector('img');
        results.push({
          url: imgEl?.src || '',
          title: imgEl?.alt || '',
          pageUrl: a.href
        });
      }
    });
    return results;
  });

  return images.filter(i => i.url && !isBlocked(i.url)).slice(0, count);
}

// Also try DuckDuckGo as backup
async function searchDDGImages(page, query, count = 5) {
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images&iaf=type:photo`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(r => setTimeout(r, 3000));

    const images = await page.evaluate(() => {
      const results = [];
      document.querySelectorAll('.tile--img__img, [data-testid="result-image-img"]').forEach(img => {
        const src = img.getAttribute('data-src') || img.src || '';
        if (src && src.startsWith('http')) {
          results.push({ url: src.startsWith('//') ? 'https:' + src : src, title: img.alt || '' });
        }
      });
      return results;
    });

    return images.filter(i => !isBlocked(i.url)).slice(0, count);
  } catch {
    return [];
  }
}

const SEARCHES = [
  { id: 'n531', queries: ['debate presidencial Peru 2026 candidatos JNE', 'debate electoral Peru marzo 2026'] },
  { id: 'n532', queries: ['Rafael Lopez Aliaga Peru candidato 2026', 'Lopez Aliaga politico Peru Renovacion Popular'] },
  { id: 'n533', queries: ['Carlos Alvarez debate presidencial Peru 2026', 'debate anticorrupcion Peru candidatos 2026'] },
  { id: 'n534', queries: ['corrupcion Peru debate electoral 2026', 'candidatos Peru anticorrupcion debate'] },
  { id: 'n535', queries: ['seguridad ciudadana Peru debate 2026', 'Jorge Nieto candidato Peru seguridad'] },
  { id: 'n536', queries: ['mapa electoral Peru elecciones historia', 'elecciones Peru historia resultados'] },
  { id: 'n537', queries: ['campaña electoral Peru TikTok redes sociales 2026', 'jovenes Peru voto campaña digital'] },
  { id: 'n538', queries: ['JNE debate presidencial Peru 2026 sede', 'Jurado Nacional Elecciones Peru debate'] },
];

async function run() {
  console.log('\n=== Scraping imágenes debate presidencial con Puppeteer ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const manifestPath = path.join(__dirname, '..', 'public', 'images', 'manifest.json');
  let manifest = {};
  try { manifest = await fs.readJSON(manifestPath); } catch {}

  for (const item of SEARCHES) {
    console.log(`\n[${item.id}] Buscando...`);

    let images = [];
    for (const q of item.queries) {
      const results = await searchGoogleImages(page, q, 5);
      if (results.length > 0) {
        images = results;
        break;
      }
      // Fallback to DuckDuckGo
      const ddg = await searchDDGImages(page, q, 5);
      if (ddg.length > 0) {
        images = ddg;
        break;
      }
    }

    if (images.length === 0) {
      console.log('  ✗ No se encontraron imágenes');
      continue;
    }

    // Download cover
    let coverOk = false;
    for (const img of images) {
      const dest = path.join(__dirname, '..', 'public', 'images', '2026', `${item.id}.jpg`);
      const ok = await downloadImage(img.url, dest);
      if (ok) {
        console.log(`  ✓ Portada: ${(img.title || img.url).slice(0, 60)}`);
        coverOk = true;
        break;
      }
    }

    manifest[item.id] = {
      cover: coverOk ? `/images/2026/${item.id}.jpg` : null,
      gallery: [],
      scrapedAt: new Date().toISOString()
    };

    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();
  await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
  console.log(`\n=== Completado. Manifest: ${Object.keys(manifest).length} entradas ===\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
