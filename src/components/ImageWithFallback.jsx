import { useState, useRef, useEffect } from 'react'

// Load manifest dynamically
let manifest = {}
try {
  const m = await import('../../public/images/manifest.json')
  manifest = m.default || m
} catch {
  // no manifest yet
}

export function ImageWithFallback({ news, className, style, showCaption = true }) {
  const cached = manifest[news.id]
  const triedFallback = useRef(false)

  // Priority: scraped local > imageFallback > picsum
  const getInitialSrc = () => {
    if (cached?.cover) return cached.cover
    return `https://picsum.photos/seed/${news.id}/800/450`
  }

  const [src, setSrc] = useState(getInitialSrc)
  const [loaded, setLoaded] = useState(false)

  const handleError = () => {
    if (!triedFallback.current) {
      triedFallback.current = true
      setSrc(`https://picsum.photos/seed/${news.id}/800/450`)
    }
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #e0ddd8 25%, #d5d2cc 50%, #e0ddd8 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite'
        }} />
      )}

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
        crossOrigin="anonymous"
      />

      {showCaption && news.imageCaption && loaded && (
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
