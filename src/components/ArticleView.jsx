import { useNavigate, Link } from 'react-router-dom'
import { ImageWithFallback } from './ImageWithFallback'
import { SocialShareBar } from './SocialShareBar'
import { REPORTERS } from '../data/reporters'
import allNews from '../data/index'
import { useMemo } from 'react'

const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const catClassMap = {
  'Politica': 'cat-politica',
  'Tecnologia': 'cat-tecnologia',
  'Videojuegos': 'cat-videojuegos',
  'Noticias Locales': 'cat-locales',
  'Festividades': 'cat-festividades',
  'Internacional': 'cat-internacional',
}

export function ArticleView({ news }) {
  const navigate = useNavigate()
  const reporter = REPORTERS.find(r => r.id === news.reporter)

  const sortedAll = useMemo(() =>
    [...allNews].sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0)),
    []
  )

  // Related: same category, different article
  const sameCat = useMemo(() =>
    sortedAll.filter(n => n.cat === news.cat && n.id !== news.id).slice(0, 5),
    [sortedAll, news]
  )

  // Related by tags
  const relatedByTag = useMemo(() => {
    const myTags = new Set(news.tags.map(t => t.toLowerCase()))
    return sortedAll
      .filter(n => n.id !== news.id && n.tags.some(t => myTags.has(t.toLowerCase())))
      .slice(0, 5)
  }, [sortedAll, news])

  // Latest overall
  const latestNews = useMemo(() =>
    sortedAll.filter(n => n.id !== news.id).slice(0, 4),
    [sortedAll, news]
  )

  // "Lee también" - pick 1 from same category
  const leeArticle = sameCat[0]

  // "Más sobre [tema]" - related by first tag
  const topicLabel = news.tags[0] || news.cat
  const moreOnTopic = useMemo(() => {
    const tag = (news.tags[0] || '').toLowerCase()
    if (!tag) return sameCat.slice(0, 4)
    return sortedAll
      .filter(n => n.id !== news.id && n.tags.some(t => t.toLowerCase() === tag))
      .slice(0, 4)
  }, [sortedAll, news, sameCat])

  // Sources array (support for multiple sources)
  const sources = news.sources || [{ name: news.source, url: news.sourceUrl }]

  // Gallery images with caption support
  const gallery = news.galleryImages || []
  const hasGallery = gallery.length > 0 && typeof gallery[0] === 'object'
  const simpleGallery = gallery.length > 0 && typeof gallery[0] === 'string'

  // Video links
  const videos = news.videoLinks || []

  // Insert gallery images and videos within body
  const renderBody = () => {
    if (!news.body || news.body.length === 0) return <p>{news.summary}</p>

    const elements = []
    const totalParagraphs = news.body.length
    // Insert gallery images at intervals
    const galleryItems = hasGallery ? gallery : []
    const galleryInterval = galleryItems.length > 0 ? Math.floor(totalParagraphs / (galleryItems.length + 1)) : 999
    let galleryIdx = 0

    // Insert "Lee también" after ~30% of body
    const leeInsertAt = Math.floor(totalParagraphs * 0.3)

    // Insert video after ~60% of body
    const videoInsertAt = Math.floor(totalParagraphs * 0.6)

    for (let i = 0; i < totalParagraphs; i++) {
      elements.push(
        <p key={`p-${i}`} className="article-paragraph">{news.body[i]}</p>
      )

      // Insert gallery image at intervals
      if (galleryIdx < galleryItems.length && (i + 1) % galleryInterval === 0 && i > 0) {
        const img = galleryItems[galleryIdx]
        elements.push(
          <figure key={`gal-${galleryIdx}`} className="article-inline-figure">
            <img src={img.src || img} alt={img.caption || `Imagen ${galleryIdx + 1}`} />
            <figcaption>
              {img.caption || `Imagen ${galleryIdx + 1}`}
              {img.source && <span className="img-source"> | Foto: {img.source}</span>}
            </figcaption>
          </figure>
        )
        galleryIdx++
      }

      // Insert "Lee también" link
      if (i === leeInsertAt && leeArticle) {
        elements.push(
          <div key="lee-tambien" className="article-lee-tambien">
            <span className="lee-label">Lee también:</span>
            <Link to={`/articulo/${leeArticle.id}`} className="lee-link">
              {leeArticle.title}
            </Link>
          </div>
        )
      }

      // Insert video embed
      if (i === videoInsertAt && videos.length > 0) {
        elements.push(
          <div key="video-embed" className="article-video-embed">
            {videos.map((v, vi) => (
              <div key={vi} className="video-container-wrapper">
                <div className="video-container">
                  <iframe
                    src={v.url}
                    title={v.title || `Video ${vi + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="video-meta">
                  {v.title && <p className="video-caption">{v.title}</p>}
                  {v.source && <p className="video-source">Video: {v.source}</p>}
                </div>
              </div>
            ))}
          </div>
        )
      }
    }

    return elements
  }

  return (
    <div className="article-view">
      {/* Breadcrumb */}
      <nav className="article-breadcrumb">
        <Link to="/">Home</Link>
        <span className="breadcrumb-sep">•</span>
        <span>{news.cat}</span>
        {news.tags[0] && (
          <>
            <span className="breadcrumb-sep">•</span>
            <span>{news.tags[0]}</span>
          </>
        )}
      </nav>

      {/* Social share floating bar */}
      <SocialShareBar title={news.title} />

      {/* Hero image */}
      <div className="article-hero-img">
        <ImageWithFallback news={news} style={{ width: '100%', height: '100%' }} />
      </div>
      {news.imageCaption && (
        <div className="article-img-credit">
          {news.imageCaption}
          {news.imageSource && <span className="img-source"> | Foto: {news.imageSource}</span>}
        </div>
      )}

      {/* Category label */}
      <span className={`article-cat-label ${catClassMap[news.cat] || ''}`}>{news.cat}</span>

      {/* Title */}
      <h1 className="article-title">{news.title}</h1>

      {/* Byline */}
      {reporter && (
        <div className="article-byline">
          <div className="byline-avatar" style={{ background: reporter.color }}>{reporter.avatar}</div>
          <div className="byline-info">
            <div className="byline-name">{reporter.name}</div>
            <div className="byline-specialty">
              {reporter.alias} · {reporter.specialty} · {reporter.origin}
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            {news.month ? `${news.month} de ${MONTH_NAMES[news.month]}` : ''} {news.year}
          </div>
        </div>
      )}

      {/* Article body with inline gallery and videos */}
      <div className="article-body">
        {renderBody()}
      </div>

      {/* Simple gallery fallback (string array) */}
      {simpleGallery && (
        <div className="article-gallery-grid">
          {gallery.map((img, i) => (
            <img key={i} src={img} alt={`Galería ${i + 1}`} className="gallery-img" />
          ))}
        </div>
      )}

      {/* Más información */}
      {news.moreInfo && (
        <div className="article-more-info">
          <h3 className="more-info-title">Más información</h3>
          {news.moreInfo.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {/* Sources */}
      <div className="article-sources">
        <strong>Fuentes:</strong>
        <ul>
          {sources.map((s, i) => (
            <li key={i}>
              {s.name}
              {s.url && (
                <>
                  {' — '}
                  <a href={s.url} target="_blank" rel="noopener noreferrer">Ver artículo original</a>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Te puede interesar */}
      {relatedByTag.length > 0 && (
        <div className="article-te-interesa">
          <div className="te-interesa-header">
            <span className="te-interesa-dot" />
            <span className="te-interesa-label">Te puede interesar</span>
          </div>
          <ul className="te-interesa-list">
            {relatedByTag.map(n => (
              <li key={n.id}>
                <Link to={`/articulo/${n.id}`}>{n.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seguir temas */}
      <div className="article-follow-topics">
        <span className="follow-label">Seguir temas</span>
        <div className="follow-tags">
          {news.tags.map(tag => (
            <span key={tag} className="follow-tag">{tag}</span>
          ))}
          <span className="follow-tag follow-tag-more">Ver Más</span>
        </div>
      </div>

      {/* Conforme a los criterios */}
      <div className="article-trust">
        <span>Conforme a los criterios de</span>
        <strong style={{ marginLeft: 6 }}>Mundoscopio Editorial</strong>
        <span style={{ margin: '0 12px', color: '#ccc' }}>|</span>
        <span>Tipo de trabajo: Noticias</span>
      </div>

      {/* Tags */}
      <div className="article-tags">
        {news.tags.map(tag => (
          <span key={tag} className="article-tag">{tag}</span>
        ))}
      </div>

      {/* === Bottom sections === */}
      <div className="article-bottom-sections">

        {/* Últimas noticias */}
        <div className="article-bottom-section">
          <h3 className="bottom-section-title">Últimas noticias <span className="bottom-arrow">›</span></h3>
          <div className="bottom-news-grid">
            {latestNews.map(n => (
              <div key={n.id} className="bottom-news-card" onClick={() => navigate(`/articulo/${n.id}`)}>
                <div className="bottom-news-img">
                  <ImageWithFallback news={n} style={{ width: '100%', height: '100%' }} showCaption={false} />
                </div>
                <span className="bottom-news-cat">{n.cat}</span>
                <h4 className="bottom-news-title">{n.title}</h4>
                <span className="bottom-news-reporter">
                  {REPORTERS.find(r => r.id === n.reporter)?.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Lo último en [categoría] */}
        <div className="article-bottom-section">
          <h3 className="bottom-section-title">
            Lo último en {news.cat} <span className="bottom-arrow">›</span>
          </h3>
          <div className="bottom-news-grid">
            {sameCat.slice(0, 4).map(n => (
              <div key={n.id} className="bottom-news-card" onClick={() => navigate(`/articulo/${n.id}`)}>
                <div className="bottom-news-img">
                  <ImageWithFallback news={n} style={{ width: '100%', height: '100%' }} showCaption={false} />
                </div>
                <span className="bottom-news-cat">{n.cat}</span>
                <h4 className="bottom-news-title">{n.title}</h4>
                <span className="bottom-news-reporter">
                  {REPORTERS.find(r => r.id === n.reporter)?.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Más sobre [tema] */}
        {moreOnTopic.length > 0 && (
          <div className="article-bottom-section">
            <h3 className="bottom-section-title">
              Más sobre {topicLabel} <span className="bottom-arrow">›</span>
            </h3>
            <div className="bottom-news-grid">
              {moreOnTopic.map(n => (
                <div key={n.id} className="bottom-news-card" onClick={() => navigate(`/articulo/${n.id}`)}>
                  <div className="bottom-news-img">
                    <ImageWithFallback news={n} style={{ width: '100%', height: '100%' }} showCaption={false} />
                  </div>
                  <span className="bottom-news-cat">{n.cat}</span>
                  <h4 className="bottom-news-title">{n.title}</h4>
                  <span className="bottom-news-reporter">
                    {REPORTERS.find(r => r.id === n.reporter)?.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
