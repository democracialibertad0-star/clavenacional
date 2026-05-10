import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const BLOCKED_DOMAINS = [
  'unsplash.com', 'freepik.com', 'shutterstock.com', 'istockphoto.com',
  'gettyimages.com', 'stock.adobe.com', 'pexels.com', 'pixabay.com',
  'depositphotos.com', 'dreamstime.com', 'picsum.photos', '123rf.com',
  'vectorstock.com', 'canva.com', 'flaticon.com', 'alamy.com',
];

const BLOCKED_PATTERNS = [
  'logo', '/brand/', 'banner', '/icon/', 'avatar', 'placeholder',
  'favicon', 'sprite', 'widget', 'badge', 'emoji',
];

// Domains of news outlets whose LOGOS we don't want (but their article images are fine)
const LOGO_PATTERNS = [
  'rpp.pe/images/logo', 'elcomercio.pe/resizer/logo', 'cnn.com/media/logo',
  'bbc.co.uk/news/special/shared/img/bbc_logo', 'larepublica.pe/lazy/logo',
];

function isBlocked(url) {
  const l = url.toLowerCase();
  if (BLOCKED_DOMAINS.some(d => l.includes(d))) return true;
  if (BLOCKED_PATTERNS.some(p => l.includes(p))) return true;
  if (LOGO_PATTERNS.some(p => l.includes(p))) return true;
  // Block very small images (likely icons)
  if (l.includes('w=50') || l.includes('w=100') || l.includes('width=50')) return true;
  return false;
}

async function bingImageSearch(query) {
  try {
    const q = encodeURIComponent(query);
    const { data } = await axios.get(`https://www.bing.com/images/search?q=${q}&form=HDRSC2&first=1`, {
      headers: { 'User-Agent': UA },
      timeout: 10000
    });
    const $ = cheerio.load(data);
    const imgs = [];

    $('a.iusc').each((i, el) => {
      try {
        const m = $(el).attr('m');
        if (m) {
          const parsed = JSON.parse(m);
          if (parsed.murl && parsed.murl.startsWith('http') && !isBlocked(parsed.murl)) {
            imgs.push({ url: parsed.murl, title: parsed.t || '', source: parsed.purl || '' });
          }
        }
      } catch {}
    });

    return imgs.slice(0, 5);
  } catch {
    return [];
  }
}

async function downloadImage(imgUrl, destPath) {
  try {
    const resp = await axios.get(imgUrl, {
      responseType: 'arraybuffer',
      timeout: 12000,
      headers: { 'User-Agent': UA },
      maxRedirects: 5
    });

    const ct = resp.headers['content-type'] || '';
    if (!ct.includes('image')) return false;

    const buf = Buffer.from(resp.data);
    if (buf.length < 5000) return false; // Too small, probably an icon

    await fs.ensureDir(path.dirname(destPath));
    await fs.writeFile(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  // Load all news
  const dataModule = await import('../src/data/index.js');
  const allNews = dataModule.default;

  const args = process.argv.slice(2);
  let targetYear = null;
  let forceAll = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year') targetYear = parseInt(args[++i]);
    if (args[i] === '--force') forceAll = true;
  }

  let news = allNews;
  if (targetYear) news = news.filter(n => n.year === targetYear);

  const manifestPath = path.join(__dirname, '..', 'public', 'images', 'manifest.json');
  let manifest = {};
  try { manifest = await fs.readJSON(manifestPath); } catch {}

  console.log(`\nRe-scraping ${news.length} noticias${targetYear ? ` (${targetYear})` : ''}...`);
  console.log(`Forzar re-descarga: ${forceAll ? 'SÍ' : 'NO (solo faltantes)'}\n`);

  let success = 0, failed = 0, skipped = 0;
  const DELAY = 800;

  for (let idx = 0; idx < news.length; idx++) {
    const article = news[idx];

    // Skip if already has a good image and not forcing
    if (!forceAll && manifest[article.id]?.cover?.startsWith('/images/')) {
      const imgPath = path.join(__dirname, '..', 'public', manifest[article.id].cover);
      if (await fs.pathExists(imgPath)) {
        const stat = await fs.stat(imgPath);
        if (stat.size > 5000) {
          skipped++;
          continue;
        }
      }
    }

    const progress = `[${idx + 1}/${news.length}]`;
    console.log(`${progress} ${article.id}: ${article.title.slice(0, 65)}...`);

    // Strategy 1: og:image from source URL
    let imagePath = null;
    if (article.sourceUrl) {
      try {
        const { data } = await axios.get(article.sourceUrl, {
          headers: { 'User-Agent': UA },
          timeout: 8000,
          maxRedirects: 3
        });
        const $ = cheerio.load(data);
        const ogImg = $('meta[property="og:image"]').attr('content') ||
                      $('meta[name="twitter:image"]').attr('content');

        if (ogImg && !isBlocked(ogImg)) {
          const abs = ogImg.startsWith('http') ? ogImg : new URL(ogImg, article.sourceUrl).href;
          const dest = path.join(__dirname, '..', 'public', 'images', String(article.year), `${article.id}.jpg`);
          const ok = await downloadImage(abs, dest);
          if (ok) {
            imagePath = `/images/${article.year}/${article.id}.jpg`;
            console.log(`  ✓ og:image`);
          }
        }
      } catch {}
    }

    // Strategy 2: Bing search with title
    if (!imagePath) {
      const imgs = await bingImageSearch(article.title);
      for (const img of imgs) {
        const dest = path.join(__dirname, '..', 'public', 'images', String(article.year), `${article.id}.jpg`);
        const ok = await downloadImage(img.url, dest);
        if (ok) {
          imagePath = `/images/${article.year}/${article.id}.jpg`;
          console.log(`  ✓ Bing: ${(img.title || '').slice(0, 50)}`);
          break;
        }
      }
    }

    // Strategy 3: Bing with simpler query
    if (!imagePath) {
      const simpleQuery = article.tags.slice(0, 3).join(' ') + ' ' + article.cat + ' Peru';
      const imgs = await bingImageSearch(simpleQuery);
      for (const img of imgs) {
        const dest = path.join(__dirname, '..', 'public', 'images', String(article.year), `${article.id}.jpg`);
        const ok = await downloadImage(img.url, dest);
        if (ok) {
          imagePath = `/images/${article.year}/${article.id}.jpg`;
          console.log(`  ✓ Bing (tags): ${(img.title || '').slice(0, 50)}`);
          break;
        }
      }
    }

    if (imagePath) {
      success++;
      manifest[article.id] = {
        cover: imagePath,
        gallery: manifest[article.id]?.gallery || [],
        scrapedAt: new Date().toISOString()
      };
    } else {
      failed++;
      console.log(`  ✗ No image found`);
    }

    // Save manifest periodically
    if ((idx + 1) % 10 === 0) {
      await fs.writeJSON(manifestPath, manifest, { spaces: 2 });
    }

    await new Promise(r => setTimeout(r, DELAY));
  }

  await fs.writeJSON(manifestPath, manifest, { spaces: 2 });

  console.log(`\n========================================`);
  console.log(`Scraping completado.`);
  console.log(`  Nuevas: ${success}`);
  console.log(`  Fallidas: ${failed}`);
  console.log(`  Saltadas (ya tenían): ${skipped}`);
  console.log(`  Total manifest: ${Object.keys(manifest).length}`);
  console.log(`========================================\n`);
}

run().catch(console.error);
