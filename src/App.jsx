import { useState, useMemo, useEffect } from 'react'
import { Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Ticker } from './components/Ticker'
import { Header } from './components/Header'
import { NewsCard } from './components/NewsCard'
import { ArticleView } from './components/ArticleView'
import { ReportersPage } from './components/ReportersPage'
import {
  TerminosPage, PrivacidadPage, CookiesPage,
  CopyrightPage, DerechosLectorPage, PublicidadPage,
  ContactoPage, EticaEditorialPage, NewsletterPage,
} from './components/LegalPages'
import { AdminPanel } from './components/AdminPanel'
import { ImageWithFallback } from './components/ImageWithFallback'
import { Footer } from './components/Footer'
import { CookieBanner } from './components/CookieBanner'
import { NewsletterPopup } from './components/NewsletterPopup'
import { REPORTERS } from './data/reporters'
import allNews from './data/index'

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]
const MONTH_NAMES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

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

function CategoryStrip({ articles, category, onArticleClick }) {
  return (
    <div className="cat-strip">
      <div className="cat-strip-header">
        <h2 className="cat-strip-title">{category}</h2>
      </div>
      <div className="cat-strip-scroll">
        {articles.map(news => (
          <div key={news.id} className="cat-strip-card" onClick={() => onArticleClick(news)}>
            <div className="cat-strip-img">
              <ImageWithFallback
                news={news}
                style={{ width: '100%', height: '100%' }}
                showCaption={false}
              />
            </div>
            <div className="cat-strip-body">
              <span className={`cat-strip-label cat-${getCatClass(news.cat)}`}>{news.cat}</span>
              <h3 className="cat-strip-card-title">{news.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ArchiveAccordion({ years, sortedAll, activeYear, setActiveYear, activeMonth, setActiveMonth, MONTH_NAMES }) {
  const getMonthsForYear = (year) => {
    const months = new Set()
    sortedAll.filter(n => n.year === year).forEach(n => { if (n.month) months.add(n.month) })
    return Array.from(months).sort((a, b) => b - a)
  }

  const getCountForYear = (year) => sortedAll.filter(n => n.year === year).length
  const getCountForMonth = (year, month) => sortedAll.filter(n => n.year === year && n.month === month).length

  return (
    <div className="archive-accordion">
      <h3 className="sidebar-title">Archivo</h3>
      {years.map(y => {
        const isOpen = activeYear === y
        const months = getMonthsForYear(y)
        return (
          <div key={y} className="archive-year-group">
            <button
              className={`archive-year-btn ${isOpen ? 'open' : ''}`}
              onClick={() => { setActiveYear(isOpen ? null : y); setActiveMonth(null) }}
            >
              <span>{y}</span>
              <span className="archive-year-count">{getCountForYear(y)}</span>
              <span className="archive-chevron">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="archive-months">
                <button
                  className={`archive-month-btn ${!activeMonth ? 'active' : ''}`}
                  onClick={() => setActiveMonth(null)}
                >
                  Todo {y}
                  <span className="archive-month-count">{getCountForYear(y)}</span>
                </button>
                {months.map(m => (
                  <button
                    key={m}
                    className={`archive-month-btn ${activeMonth === m ? 'active' : ''}`}
                    onClick={() => setActiveMonth(activeMonth === m ? null : m)}
                  >
                    {String(m).padStart(2, '0')} — {MONTH_NAMES[m]}
                    <span className="archive-month-count">{getCountForMonth(y, m)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const catParam = searchParams.get('cat')
  const [activeCategory, setActiveCategory] = useState(catParam || 'Todas')
  const [activeYear, setActiveYear] = useState(null)
  const [activeMonth, setActiveMonth] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Sync category from URL params (when navigating from other pages)
  useEffect(() => {
    if (catParam) setActiveCategory(catParam)
  }, [catParam])

  const sortedAll = useMemo(() =>
    [...allNews].sort((a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      b.year - a.year ||
      (b.month || 0) - (a.month || 0)
    ),
    []
  )

  const filteredNews = useMemo(() => {
    let news = sortedAll
    if (activeCategory !== 'Todas') news = news.filter(n => n.cat === activeCategory)
    if (activeYear) news = news.filter(n => n.year === activeYear)
    if (activeMonth) news = news.filter(n => n.month === activeMonth)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      news = news.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return news
  }, [sortedAll, activeCategory, activeYear, activeMonth, searchQuery])

  const heroNews = filteredNews.slice(0, 4)
  const restNews = filteredNews.slice(4)
  const latestNews = sortedAll.slice(0, 10)
  const todayReporter = REPORTERS[new Date().getDay() % REPORTERS.length]

  // Category sections for homepage strips
  const catSections = useMemo(() => {
    const cats = ['Politica', 'Tecnologia', 'Internacional', 'Videojuegos', 'Noticias Locales', 'Festividades']
    return cats.map(cat => ({
      cat,
      articles: sortedAll.filter(n => n.cat === cat).slice(0, 6)
    })).filter(s => s.articles.length > 0)
  }, [sortedAll])

  // Grouped by month for archive view
  const groupedByMonth = useMemo(() => {
    if (!activeYear) return null
    const groups = {}
    restNews.forEach(n => {
      const m = n.month || 0
      if (!groups[m]) groups[m] = []
      groups[m].push(n)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([month, articles]) => ({
        month: Number(month),
        label: MONTH_NAMES[Number(month)] || 'Sin mes',
        articles
      }))
  }, [restNews, activeYear])

  const handleArticleClick = (news) => navigate(`/articulo/${news.id}`)

  const isFiltering = activeCategory !== 'Todas' || activeYear || searchQuery.trim()

  return (
    <>
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <div className="container">

        {/* Search bar */}
        <div className="search-bar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar noticias..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Hero section */}
        {heroNews.length >= 4 && !isFiltering && (
          <div className="hero-grid">
            <div className="hero-main" onClick={() => handleArticleClick(heroNews[0])}>
              <ImageWithFallback
                news={heroNews[0]}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                showCaption={false}
              />
              <div className="hero-overlay">
                <span className="hero-cat" style={{ background: REPORTERS.find(r => r.id === heroNews[0].reporter)?.color }}>
                  {heroNews[0].cat}
                </span>
                <h2 className="hero-title">{heroNews[0].title}</h2>
                <p className="hero-summary">{heroNews[0].summary}</p>
              </div>
            </div>
            <div className="hero-sidebar">
              {heroNews.slice(1, 4).map(news => (
                <div key={news.id} className="hero-side-card" onClick={() => handleArticleClick(news)}>
                  <ImageWithFallback
                    news={news}
                    style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                    showCaption={false}
                  />
                  <div className="hero-overlay">
                    <span className="hero-cat" style={{ background: REPORTERS.find(r => r.id === news.reporter)?.color }}>
                      {news.cat}
                    </span>
                    <h2 className="hero-title">{news.title}</h2>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending bar */}
        {!isFiltering && (
          <div className="trending-bar">
            <span className="trending-label">Tendencias</span>
            {sortedAll.slice(0, 5).map((n, i) => (
              <span key={n.id} className="trending-item" onClick={() => handleArticleClick(n)}>
                <span className="trending-num">{i + 1}</span>
                {n.title.length > 55 ? n.title.slice(0, 55) + '...' : n.title}
              </span>
            ))}
          </div>
        )}

        <div className="main-layout">
          <div className="main-content">
            {isFiltering ? (
              /* Filtered/archive view */
              <div className="news-section">
                <h2 className="section-title">
                  {activeCategory !== 'Todas' ? activeCategory :
                   activeYear ? `Noticias ${activeYear}` : 'Resultados'}
                  <span className="section-count">{filteredNews.length} artículos</span>
                </h2>

                {activeYear && groupedByMonth ? (
                  groupedByMonth.map(group => (
                    <div key={group.month} className="month-group">
                      <div className="month-group-header">
                        <span className="month-group-name">{group.label}</span>
                        <span className="month-group-count">{group.articles.length}</span>
                      </div>
                      <div className="news-grid">
                        {group.articles.map(news => (
                          <NewsCard key={news.id} news={news} onClick={handleArticleClick} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="news-grid">
                    {filteredNews.map(news => (
                      <NewsCard key={news.id} news={news} onClick={handleArticleClick} />
                    ))}
                  </div>
                )}

                {filteredNews.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                    No se encontraron noticias con esos filtros.
                  </p>
                )}
              </div>
            ) : (
              /* Homepage category strips */
              <>
                {/* Latest news section */}
                <div className="news-section">
                  <h2 className="section-title">Últimas Noticias</h2>
                  <div className="news-grid">
                    {sortedAll.slice(4, 10).map(news => (
                      <NewsCard key={news.id} news={news} onClick={handleArticleClick} />
                    ))}
                  </div>
                </div>

                {/* Newsletter CTA */}
                <div className="newsletter-cta">
                  <div className="newsletter-cta-text">
                    <h3>Suscríbete al newsletter de Mundoscopio</h3>
                    <p>Recibe las noticias más importantes cada semana en tu correo.</p>
                  </div>
                  <div className="newsletter-cta-form">
                    <input type="email" placeholder="Tu correo electrónico" className="newsletter-input" />
                    <button className="newsletter-btn">Suscribirse</button>
                  </div>
                </div>

                {/* Category strips */}
                {catSections.map(({ cat, articles }) => (
                  <CategoryStrip key={cat} articles={articles} category={cat} onArticleClick={handleArticleClick} />
                ))}
              </>
            )}
          </div>

          <aside className="sidebar">
            {/* Trending sidebar */}
            <div className="sidebar-box">
              <h3 className="sidebar-title">Lo Más Leído</h3>
              {latestNews.map((news, i) => (
                <div key={news.id} className="sidebar-news-item" onClick={() => handleArticleClick(news)}>
                  <span className="sidebar-rank">{i + 1}</span>
                  <div>
                    <div className="sidebar-news-title">{news.title}</div>
                    <div className="sidebar-news-meta">{news.cat} · {MONTH_NAMES[news.month]} {news.year}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Archive accordion */}
            <div className="sidebar-box">
              <ArchiveAccordion
                years={YEARS}
                sortedAll={sortedAll}
                activeYear={activeYear}
                setActiveYear={setActiveYear}
                activeMonth={activeMonth}
                setActiveMonth={setActiveMonth}
                MONTH_NAMES={MONTH_NAMES}
              />
            </div>

            {/* Newsletter sidebar */}
            <div className="sidebar-box sidebar-newsletter">
              <h3 className="sidebar-title">Newsletter</h3>
              <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 12, lineHeight: 1.5 }}>
                Recibe las noticias más importantes cada semana en tu correo.
              </p>
              <input type="email" placeholder="Tu correo" className="sidebar-nl-input" />
              <button className="sidebar-nl-btn">Suscribirse</button>
            </div>

            {/* Categories */}
            <div className="sidebar-box">
              <h3 className="sidebar-title">Categorías</h3>
              {['Politica', 'Tecnologia', 'Videojuegos', 'Festividades', 'Noticias Locales', 'Internacional'].map(cat => {
                const count = allNews.filter(n => n.cat === cat).length
                return (
                  <div
                    key={cat}
                    className="sidebar-cat-row"
                    onClick={() => { setActiveCategory(cat); window.scrollTo(0, 0) }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`cat-dot cat-bar-${getCatClass(cat)}`} />
                      {cat}
                    </span>
                    <span className="sidebar-cat-count">{count}</span>
                  </div>
                )
              })}
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function ArticlePage() {
  const { id } = useParams()
  const news = allNews.find(n => n.id === id)

  if (!news) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Articulo no encontrado</h2>
        <p style={{ color: '#666', marginTop: 8 }}>El articulo que buscas no existe.</p>
      </div>
    )
  }

  return <ArticleView news={news} />
}

function AboutPage() {
  return (
    <div className="about-page">
      <h1>Acerca de Mundoscopio</h1>
      <p>
        <strong>Mundoscopio</strong> es un noticiero digital peruano fundado el
        23 de marzo de 2018 en Chimbote, Áncash.
      </p>
      <p>
        Nuestro equipo está conformado por 6 reporteros, cada uno especializado
        en una categoría informativa: Política, Tecnología, Videojuegos, Festividades,
        Noticias Locales (con enfoque en Áncash y el norte del Perú) e Internacional.
      </p>
      <p>
        Todas las noticias publicadas en Mundoscopio están basadas en eventos reales,
        redactadas con estilo editorial propio. Cada artículo se fundamenta en fuentes
        periodísticas verificables como El Comercio, La República, RPP, BBC Mundo,
        entre otras.
      </p>
      <p>
        Mundoscopio nació con la visión de democratizar el acceso a la información
        desde una perspectiva local, conectando Chimbote y Áncash con el Perú y el mundo.
      </p>
      <p>
        <strong>Contacto:</strong> mundoscopio@noticiero.pe
        <br />
        <strong>Ubicacion:</strong> Nuevo Chimbote, Ancash, Peru
        <br />
        <strong>Fundado:</strong> 23 de marzo de 2018
      </p>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Ticker news={[...allNews].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.year - a.year || (b.month || 0) - (a.month || 0))} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articulo/:id" element={<ArticlePage />} />
        <Route path="/reporteros" element={<ReportersPage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="/terminos" element={<TerminosPage />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/copyright" element={<CopyrightPage />} />
        <Route path="/derechos-lector" element={<DerechosLectorPage />} />
        <Route path="/publicidad" element={<PublicidadPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
        <Route path="/etica-editorial" element={<EticaEditorialPage />} />
        <Route path="/newsletter" element={<NewsletterPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      <Footer />
      <CookieBanner />
      <NewsletterPopup />
    </>
  )
}
