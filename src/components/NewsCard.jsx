import { ImageWithFallback } from './ImageWithFallback'
import { REPORTERS } from '../data/reporters'

function getCatClass(cat) {
  const map = {
    'Politica': 'politica',
    'Tecnologia': 'tecnologia',
    'Videojuegos': 'videojuegos',
    'Noticias Locales': 'locales',
    'Festividades': 'festividades',
    'Internacional': 'internacional',
  }
  return map[cat] || 'politica'
}

export function NewsCard({ news, onClick }) {
  const reporter = REPORTERS.find(r => r.id === news.reporter)
  const catClass = getCatClass(news.cat)

  return (
    <div className="news-card" onClick={() => onClick(news)}>
      <div className="news-card-img">
        <ImageWithFallback
          news={news}
          style={{ width: '100%', height: '100%' }}
          showCaption={false}
        />
      </div>
      <div className="news-card-body">
        <span className={`news-card-cat cat-${catClass}`}>{news.cat}</span>
        <h3 className="news-card-title">{news.title}</h3>
        <p className="news-card-summary">{news.summary}</p>
        <div className="news-card-meta">
          {reporter && (
            <span className="reporter-badge">
              <span
                className="reporter-avatar-mini"
                style={{ background: reporter.color }}
              >
                {reporter.avatar}
              </span>
              {reporter.name}
            </span>
          )}
          <span>{news.year} {news.month ? `/ ${String(news.month).padStart(2, '0')}` : ''}</span>
          <span>{news.source}</span>
        </div>
      </div>
    </div>
  )
}
