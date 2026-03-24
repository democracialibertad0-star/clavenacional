import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs-extra'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// Strategy 1: Get og:image from sourceUrl
async function scrapeOG(url, newsId, year) {
  if (!url) return null
  try {
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': UA },
      timeout: 8000,
      maxRedirects: 3
    })
    const $ = cheerio.load(data)
    const imgUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="og:image:secure_url"]').attr('content') ||
      null

    if (imgUrl) {
      const abs = imgUrl.startsWith('http') ? imgUrl : new URL(imgUrl, url).href
      return await downloadImage(abs, newsId, year, url)
    }
  } catch (e) {
    // silently fail, will try next strategy
  }
  return null
}

// Strategy 2: Bing Image search
async function scrapeBing(query, newsId, year) {
  try {
    const q = encodeURIComponent(query)
    const url = `https://www.bing.com/images/search?q=${q}&form=HDRSC2&first=1`
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': UA },
      timeout: 8000
    })
    const $ = cheerio.load(data)

    // Extract image URLs from Bing results
    const images = []
    $('a.iusc').each((i, el) => {
      try {
        const m = $(el).attr('m')
        if (m) {
          const parsed = JSON.parse(m)
          if (parsed.murl && parsed.murl.startsWith('http')) {
            images.push(parsed.murl)
          }
        }
      } catch {}
    })

    // Also try img tags with data-src
    if (images.length === 0) {
      $('img.mimg').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src')
        if (src && src.startsWith('http') && !src.includes('bing.com/th')) {
          images.push(src)
        }
      })
    }

    // Try thumbnail URLs from Bing
    if (images.length === 0) {
      $('img').each((i, el) => {
        const src = $(el).attr('src')
        if (src && src.includes('bing.com/th/id/') && src.includes('w=') ) {
          images.push(src)
        }
      })
    }

    for (const imgUrl of images.slice(0, 3)) {
      const result = await downloadImage(imgUrl, newsId, year)
      if (result) return result
    }
  } catch {}
  return null
}

// Strategy 3: DuckDuckGo instant answer images
async function scrapeDDG(query, newsId, year) {
  try {
    const q = encodeURIComponent(query)
    const url = `https://duckduckgo.com/?q=${q}&iax=images&ia=images`
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': UA },
      timeout: 8000
    })

    // Extract vqd token
    const vqdMatch = data.match(/vqd=['"]([^'"]+)['"]/)
    if (vqdMatch) {
      const vqd = vqdMatch[1]
      const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${q}&vqd=${vqd}&f=,,,,,&p=1`
      const { data: imgData } = await axios.get(apiUrl, {
        headers: { 'User-Agent': UA },
        timeout: 8000
      })
      if (imgData.results) {
        for (const r of imgData.results.slice(0, 3)) {
          if (r.image && r.image.startsWith('http')) {
            const result = await downloadImage(r.image, newsId, year)
            if (result) return result
          }
        }
      }
    }
  } catch {}
  return null
}

// Strategy 4: Wikimedia Commons search
async function scrapeWikimedia(query, newsId, year) {
  try {
    const q = encodeURIComponent(query)
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${q}&srnamespace=6&srlimit=5&format=json`
    const { data } = await axios.get(url, {
      headers: { 'User-Agent': UA },
      timeout: 8000
    })

    if (data.query && data.query.search) {
      for (const result of data.query.search) {
        const title = result.title
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json`
        const { data: info } = await axios.get(infoUrl, {
          headers: { 'User-Agent': UA },
          timeout: 5000
        })
        const pages = info.query?.pages
        if (pages) {
          for (const p of Object.values(pages)) {
            const imgInfo = p.imageinfo?.[0]
            if (imgInfo?.thumburl) {
              const dl = await downloadImage(imgInfo.thumburl, newsId, year)
              if (dl) return dl
            }
          }
        }
      }
    }
  } catch {}
  return null
}

async function downloadImage(imgUrl, newsId, year, referer) {
  try {
    const response = await axios.get(imgUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': UA,
        ...(referer ? { 'Referer': referer } : {})
      }
    })

    const contentType = response.headers['content-type'] || ''
    if (!contentType.includes('image')) return null

    const dir = path.join(__dirname, '..', 'public', 'images', String(year))
    await fs.ensureDir(dir)
    const destPath = path.join(dir, `${newsId}.jpg`)

    await sharp(Buffer.from(response.data))
      .resize(800, 450, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toFile(destPath)

    console.log(`  OK ${newsId} -> ${destPath}`)
    return `/images/${year}/${newsId}.jpg`
  } catch {
    return null
  }
}

async function run() {
  // Load all news
  const dataIndex = await import('../src/data/index.js')
  const allNews = dataIndex.default

  const args = process.argv.slice(2)
  let targetYear = null
  let targetCat = null
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--year') targetYear = parseInt(args[++i])
    if (args[i] === '--cat') targetCat = args[++i]
  }

  const news = allNews.filter(n =>
    (!targetYear || n.year === targetYear) &&
    (!targetCat || n.cat === targetCat)
  )

  const manifestPath = path.join(__dirname, '..', 'public', 'images', 'manifest.json')
  let manifest = {}
  try { manifest = await fs.readJSON(manifestPath) } catch {}

  console.log(`\nScraping ${news.length} noticias...`)
  if (targetYear) console.log(`Ano: ${targetYear}`)
  if (targetCat) console.log(`Categoria: ${targetCat}`)

  let success = 0
  let failed = 0
  const DELAY = 800 // ms between requests

  for (const article of news) {
    if (manifest[article.id]?.cover?.startsWith('/images/')) {
      // Already has a local image
      continue
    }

    console.log(`\n[${article.id}] ${article.title.slice(0, 60)}...`)

    let imagePath = null

    // Try og:image from sourceUrl first
    if (article.sourceUrl) {
      console.log(`  1. og:image...`)
      imagePath = await scrapeOG(article.sourceUrl, article.id, article.year)
    }

    // Try Bing search with title
    if (!imagePath) {
      console.log(`  2. Bing...`)
      imagePath = await scrapeBing(article.title, article.id, article.year)
    }

    // Try DuckDuckGo
    if (!imagePath) {
      console.log(`  3. DuckDuckGo...`)
      imagePath = await scrapeDDG(article.imageQuery || article.title, article.id, article.year)
    }

    // Try Wikimedia
    if (!imagePath) {
      console.log(`  4. Wikimedia...`)
      imagePath = await scrapeWikimedia(article.imageQuery || article.title, article.id, article.year)
    }

    if (imagePath) {
      success++
      manifest[article.id] = {
        cover: imagePath,
        gallery: [],
        scrapedAt: new Date().toISOString()
      }
    } else {
      failed++
      console.log(`  FAIL - no image found`)
    }

    // Save manifest after each article
    await fs.writeJSON(manifestPath, manifest, { spaces: 2 })
    await new Promise(r => setTimeout(r, DELAY))
  }

  console.log(`\n========================================`)
  console.log(`Scraping completado.`)
  console.log(`  Exitosos: ${success}`)
  console.log(`  Fallidos: ${failed}`)
  console.log(`  Total en manifest: ${Object.keys(manifest).length}`)
  console.log(`========================================\n`)
}

run().catch(console.error)
