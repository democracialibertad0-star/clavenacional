import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs-extra'
import sharp from 'sharp'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

async function scrapeOGImage(articleUrl, newsId, year) {
  try {
    const { data } = await axios.get(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                    + 'AppleWebKit/537.36 (KHTML, like Gecko) '
                    + 'Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    })
    const $ = cheerio.load(data)

    const imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('article img').first().attr('src') ||
      $('figure img').first().attr('src') ||
      $('.featured-image img').first().attr('src') ||
      $('.hero-image img').first().attr('src') ||
      null

    if (imageUrl) {
      const absoluteUrl = imageUrl.startsWith('http')
        ? imageUrl
        : new URL(imageUrl, articleUrl).href

      const response = await axios.get(absoluteUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: { 'Referer': articleUrl }
      })

      const dir = `public/images/${year}`
      await fs.ensureDir(dir)
      const destPath = `${dir}/${newsId}.jpg`

      await sharp(Buffer.from(response.data))
        .resize(800, 450, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toFile(destPath)

      console.log(`\u2705 ${newsId} \u2192 ${destPath}`)
      return `/${destPath}`
    }
  } catch (e) {
    console.warn(`\u26A0\uFE0F  ${newsId} (${articleUrl}): ${e.message}`)
    return null
  }
}

async function scrapeImageFromSearch(query, newsId, year) {
  let browser
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query + ' noticia periodico')}&iax=images&ia=images`
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 15000 })
    await page.waitForSelector('[data-testid="result-image-img"], .tile--img__img', { timeout: 8000 })

    const imgSrc = await page.evaluate(() => {
      const selectors = [
        '[data-testid="result-image-img"]',
        '.tile--img__img',
        '.js-lazyload'
      ]
      for (const sel of selectors) {
        const imgs = document.querySelectorAll(sel)
        for (const img of imgs) {
          const src = img.getAttribute('data-src') || img.getAttribute('src') || img.src
          if (src &&
              !src.includes('logo') &&
              !src.includes('avatar') &&
              !src.includes('icon') &&
              (src.startsWith('http') || src.startsWith('//'))) {
            return src.startsWith('//') ? 'https:' + src : src
          }
        }
      }
      return null
    })

    if (imgSrc) {
      const response = await axios.get(imgSrc, {
        responseType: 'arraybuffer',
        timeout: 15000
      })
      const dir = `public/images/${year}`
      await fs.ensureDir(dir)
      const destPath = `${dir}/${newsId}.jpg`

      await sharp(Buffer.from(response.data))
        .resize(800, 450, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 85 })
        .toFile(destPath)

      console.log(`\u2705 ${newsId} (search) \u2192 ${destPath}`)
      return `/${destPath}`
    }
  } catch (e) {
    console.warn(`\u26A0\uFE0F  search fallback ${newsId}: ${e.message}`)
  } finally {
    if (browser) await browser.close()
  }
  return null
}

async function scrapeGalleryImages(articleUrl, newsId, year) {
  try {
    const { data } = await axios.get(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    })
    const $ = cheerio.load(data)
    const images = []

    $('article img, .article-body img, .content img, figure img').each((i, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src')
      const alt = $(el).attr('alt') || ''
      const width = parseInt($(el).attr('width') || '0')

      if (src &&
          !src.includes('logo') &&
          !src.includes('avatar') &&
          !src.includes('ads') &&
          !src.includes('banner') &&
          (width === 0 || width >= 400)) {
        const absoluteUrl = src.startsWith('http')
          ? src
          : new URL(src, articleUrl).href
        images.push({ url: absoluteUrl, caption: alt })
      }
    })

    const gallery = []
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      try {
        const response = await axios.get(images[i].url, {
          responseType: 'arraybuffer', timeout: 10000
        })
        const dir = `public/images/${year}/gallery`
        await fs.ensureDir(dir)
        const destPath = `${dir}/${newsId}_${i}.jpg`

        await sharp(Buffer.from(response.data))
          .resize(1200, 675, { fit: 'inside' })
          .jpeg({ quality: 85 })
          .toFile(destPath)

        gallery.push({ src: `/${destPath}`, caption: images[i].caption })
      } catch {
        // continue
      }
    }
    return gallery
  } catch {
    return []
  }
}

async function runScraper(options = {}) {
  // Dynamic import of all news data
  const dataModule = await import('../src/data/index.js')
  const allNews = dataModule.default

  const targetYear = options.year ? parseInt(options.year) : null
  const targetCat  = options.cat  || null
  const news = allNews.filter(n =>
    (!targetYear || n.year === targetYear) &&
    (!targetCat  || n.cat  === targetCat)
  )

  const manifestPath = 'public/images/manifest.json'
  let manifest = {}
  try { manifest = await fs.readJSON(manifestPath) } catch {}

  const DELAY_MS = 2000

  console.log(`\nProcesando ${news.length} noticias...`)
  if (targetYear) console.log(`Filtro: year=${targetYear}`)
  if (targetCat) console.log(`Filtro: cat=${targetCat}`)
  console.log('')

  for (const article of news) {
    if (manifest[article.id]) {
      console.log(`\u23ED  ${article.id} ya procesado`)
      continue
    }

    let imagePath = null

    if (article.sourceUrl) {
      imagePath = await scrapeOGImage(article.sourceUrl, article.id, article.year)
    }

    if (!imagePath) {
      imagePath = await scrapeImageFromSearch(
        article.title,
        article.id,
        article.year
      )
    }

    if (!imagePath) {
      imagePath = article.imageFallback
      console.log(`\uD83D\uDCE6 ${article.id} \u2192 usando fallback Unsplash`)
    }

    let gallery = []
    if (article.sourceUrl) {
      gallery = await scrapeGalleryImages(article.sourceUrl, article.id, article.year)
    }

    manifest[article.id] = {
      cover: imagePath,
      gallery,
      scrapedAt: new Date().toISOString()
    }

    await fs.writeJSON(manifestPath, manifest, { spaces: 2 })
    await new Promise(r => setTimeout(r, DELAY_MS))
  }

  console.log(`\n\u2705 Scraping completo. ${Object.keys(manifest).length} imagenes procesadas.`)
}

const args = process.argv.slice(2)
const options = {}
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--year') options.year = args[++i]
  if (args[i] === '--cat')  options.cat  = args[++i]
}
runScraper(options)
