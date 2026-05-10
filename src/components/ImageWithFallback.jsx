import { useState } from 'react'

const SUPABASE_STORAGE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/clavenacional-images`
  : null

function resolveImageUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (SUPABASE_STORAGE) return `${SUPABASE_STORAGE}/${path.replace(/^\/images\//, '')}`
  return path
}

// Load manifest dynamically
let manifest = {}
try {
  const m = await import('../../public/images/manifest.json')
  manifest = m.default || m
} catch {
  // no manifest yet
}

const CAT_COLORS = {
  'Politica': '#C0392B',
  'Tecnologia': '#2980B9',
  'Videojuegos': '#8E44AD',
  'Noticias Locales': '#27AE60',
  'Festividades': '#E67E22',
  'Internacional': '#16A085',
}

export function ImageWithFallback({ news, className, style, showCaption = true }) {
  const cached = manifest[news.id]
  const hasLocalImage = cached?.cover?.startsWith('/images/') || cached?.cover?.startsWith('http')
  const [src, setSrc] = useState(hasLocalImage ? resolveImageUrl(cached.cover) : null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(!src)

  const handleError = () => {
    setFailed(true)
  }

  const catColor = CAT_COLORS[news.cat] || '#666'

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {/* Shimmer loader or category placeholder */}
      {(!loaded || failed) && (
        <div style={{
          position: 'absolute', inset: 0,
          background: failed
            ? `linear-gradient(135deg, ${catColor}22 0%, ${catColor}44 100%)`
            : 'linear-gradient(90deg, #e0ddd8 25%, #d5d2cc 50%, #e0ddd8 75%)',
          backgroundSize: failed ? '100% 100%' : '200% 100%',
          animation: failed ? 'none' : 'shimmer 1.5s infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
          padding: 20,
        }}>
          {failed && (
            <>
              <span style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontWeight: 700,
                color: catColor,
                opacity: 0.7,
              }}>
                {news.cat}
              </span>
              <span style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '0.9rem',
                fontWeight: 700,
                color: '#333',
                textAlign: 'center',
                lineHeight: 1.3,
                maxWidth: '80%',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {news.title}
              </span>
            </>
          )}
        </div>
      )}

      {src && !failed && (
        <img
          src={src}
          alt={news.title}
          className={className}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'opacity .4s',
            opacity: loaded ? 1 : 0,
            display: 'block'
          }}
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      )}

      {showCaption && news.imageCaption && (loaded || failed) && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,.75))',
          color: '#fff', fontSize: '.65rem', padding: '20px 10px 6px',
          fontFamily: 'Source Sans 3, sans-serif'
        }}>
          {news.imageCaption}
        </div>
      )}
    </div>
  )
}
