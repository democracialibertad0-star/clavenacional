import { useNavigate } from 'react-router-dom'
import { ImageWithFallback } from './ImageWithFallback'
import { REPORTERS } from '../data/reporters'

export function ArticleView({ news }) {
  const navigate = useNavigate()
  const reporter = REPORTERS.find(r => r.id === news.reporter)

  const catClassMap = {
    'Politica': 'cat-politica',
    'Tecnologia': 'cat-tecnologia',
    'Videojuegos': 'cat-videojuegos',
    'Noticias Locales': 'cat-locales',
    'Festividades': 'cat-festividades',
    'Internacional': 'cat-internacional',
  }

  return (
    <div className="article-view">
      <span className="article-back" onClick={() => navigate(-1)}>
        ← Volver
      </span>

      <div className="article-hero-img">
        <ImageWithFallback
          news={news}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <span className={`article-cat-label ${catClassMap[news.cat] || ''}`}>
        {news.cat}
      </span>

      <h1 className="article-title">{news.title}</h1>

      {reporter && (
        <div className="article-byline">
          <div className="byline-avatar" style={{ background: reporter.color }}>
            {reporter.avatar}
          </div>
          <div className="byline-info">
            <div className="byline-name">{reporter.name}</div>
            <div className="byline-specialty">
              {reporter.alias} · {reporter.specialty} · {reporter.origin}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            {news.year}{news.month ? ` / ${String(news.month).padStart(2, '0')}` : ''}
          </div>
        </div>
      )}

      <div className="article-body">
        {news.body ? (
          news.body.map((paragraph, i) => (
            <p key={i} style={{ marginBottom: '1.2em' }}>{paragraph}</p>
          ))
        ) : (
          <p>{news.summary}</p>
        )}
      </div>

      {news.galleryImages && news.galleryImages.length > 0 && (
        <div className="article-gallery">
          {news.galleryImages.map((img, i) => (
            <img key={i} src={img} alt={`Galeria ${i + 1}`} />
          ))}
        </div>
      )}

      <div className="article-tags">
        {news.tags.map(tag => (
          <span key={tag} className="article-tag">{tag}</span>
        ))}
      </div>

      <div className="article-source">
        <strong>Fuente:</strong> {news.source}
        {news.sourceUrl && (
          <>
            {' — '}
            <a
              href={news.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2980B9' }}
            >
              Ver articulo original
            </a>
          </>
        )}
      </div>
    </div>
  )
}
