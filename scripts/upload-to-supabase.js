#!/usr/bin/env node
/**
 * Sube todas las imágenes de public/images/ a Supabase Storage
 * bucket: clavenacional-images
 * Estructura: {year}/n001.jpg  (misma que local)
 *
 * Uso: node scripts/upload-to-supabase.js
 * Requiere: VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE en .env
 *           npm install @supabase/supabase-js dotenv
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images')
const BUCKET = 'clavenacional-images'
const MANIFEST_PATH = path.join(IMAGES_DIR, 'manifest.json')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
)

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) throw new Error(`No se pudo crear el bucket: ${error.message}`)
    console.log(`✓ Bucket '${BUCKET}' creado`)
  } else {
    console.log(`✓ Bucket '${BUCKET}' ya existe`)
  }
}

async function uploadImages() {
  const years = fs.readdirSync(IMAGES_DIR).filter(f =>
    fs.statSync(path.join(IMAGES_DIR, f)).isDirectory() && /^\d{4}$/.test(f)
  )

  let uploaded = 0, skipped = 0, failed = 0

  for (const year of years.sort()) {
    const yearDir = path.join(IMAGES_DIR, year)
    const files = fs.readdirSync(yearDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))

    for (const file of files) {
      const localPath = path.join(yearDir, file)
      const storagePath = `${year}/${file}`
      const contentType = file.endsWith('.png') ? 'image/png'
        : file.endsWith('.webp') ? 'image/webp'
        : 'image/jpeg'

      const buffer = fs.readFileSync(localPath)
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType, upsert: false })

      if (error?.message?.includes('already exists')) {
        skipped++
      } else if (error) {
        console.error(`  ✗ ${storagePath}: ${error.message}`)
        failed++
      } else {
        console.log(`  ↑ ${storagePath}`)
        uploaded++
      }
    }
  }

  console.log(`\nResumen: ${uploaded} subidas, ${skipped} ya existían, ${failed} errores`)
  return { uploaded, skipped, failed }
}

async function updateManifest() {
  const baseUrl = `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}`
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))

  let changed = 0
  for (const [id, data] of Object.entries(manifest)) {
    if (data.cover?.startsWith('/images/')) {
      const relativePath = data.cover.replace('/images/', '')
      manifest[id].cover = `${baseUrl}/${relativePath}`
      changed++
    }
    if (Array.isArray(data.gallery)) {
      manifest[id].gallery = data.gallery.map(url =>
        url.startsWith('/images/')
          ? `${baseUrl}/${url.replace('/images/', '')}`
          : url
      )
    }
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
  console.log(`✓ manifest.json actualizado (${changed} entradas)`)
}

async function main() {
  console.log('=== Upload imágenes → Supabase Storage ===\n')
  await ensureBucket()
  const { failed } = await uploadImages()
  if (failed === 0) await updateManifest()
  else console.warn('\n⚠ Hay errores — manifest.json NO fue actualizado')
}

main().catch(err => { console.error(err); process.exit(1) })
