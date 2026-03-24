import { useState, useMemo } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { Ticker } from './components/Ticker'
import { Header } from './components/Header'
import { NewsCard } from './components/NewsCard'
import { ArticleView } from './components/ArticleView'
import { ReportersPage } from './components/ReportersPage'
import { TerminosPage, PrivacidadPage, CookiesPage } from './components/LegalPages'
import { AdminPanel } from './components/AdminPanel'
import { ImageWithFallback } from './components/ImageWithFallback'
import { Footer } from './components/Footer'
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

function HomePage() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [activeYear, setActiveYear] = useState(null)
  const [activeMonth, setActiveMonth] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const sortedAll = useMemo(() =>
    [...allNews].sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0)),
    []
  )

  const filteredNews = useMemo(() => {
    let news = sortedAll

    if (activeCategory !== 'Todas') {
      news = news.filter(n => n.cat === activeCategory)
    }
    if (activeYear) {
      news = news.filter(n => n.year === activeYear)
    }
    if (activeMonth) {
      news = news.filter(n => n.month === activeMonth)
    }
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

  // Get available months for selected year
  const availableMonths = useMemo(() => {
    if (!activeYear) return []
    const months = new Set()
    sortedAll.filter(n => n.year === activeYear).forEach(n => {
      if (n.month) months.add(n.month)
    })
    return Array.from(months).sort((a, b) => a - b)
  }, [sortedAll, activeYear])

  const heroNews = filteredNews.slice(0, 3)
  const restNews = filteredNews.slice(3)
  const latestNews = sortedAll.slice(0, 8)
  const todayReporter = REPORTERS[new Date().getDay() % REPORTERS.length]

  const handleArticleClick = (news) => {
    navigate(`/articulo/${news.id}`)
  }

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

  return (
    <>
      <Header activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      <div className="container">
        <div className="search-bar">
          <input
            className="search-input"
            type="text"
            placeholder="Buscar noticias..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <div className="year-filters">
            <button
              className={`year-btn ${!activeYear ? 'active' : ''}`}
              onClick={() => { setActiveYear(null); setActiveMonth(null) }}
            >
              Todos
            </button>
            {YEARS.map(y => (
              <button
                key={y}
                className={`year-btn ${activeYear === y ? 'active' : ''}`}
                onClick={() => { setActiveYear(activeYear === y ? null : y); setActiveMonth(null) }}
              >
                {y}
              </button>
            ))}
          </div>
          {activeYear && availableMonths.length > 0 && (
            <div className="year-filters" style={{ marginTop: 8 }}>
              <button
                className={`year-btn ${!activeMonth ? 'active' : ''}`}
                onClick={() => setActiveMonth(null)}
              >
                Todo {activeYear}
              </button>
              {availableMonths.map(m => (
                <button
                  key={m}
                  className={`year-btn ${activeMonth === m ? 'active' : ''}`}
                  onClick={() => setActiveMonth(activeMonth === m ? null : m)}
                >
                  {MONTH_NAMES[m]}
                </button>
              ))}
            </div>
          )}
        </div>

        {heroNews.length >= 3 && (
          <div className="hero-grid">
            <div className="hero-main" onClick={() => handleArticleClick(heroNews[0])}>
              <ImageWithFallback
                news={heroNews[0]}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                showCaption={false}
              />
              <div className="hero-overlay">
                <span
                  className="hero-cat"
                  style={{ background: REPORTERS.find(r => r.id === heroNews[0].reporter)?.color }}
                >
                  {heroNews[0].cat}
                </span>
                <h2 className="hero-title">{heroNews[0].title}</h2>
                <p className="hero-summary">{heroNews[0].summary}</p>
              </div>
            </div>
            <div className="hero-sidebar">
              {heroNews.slice(1, 3).map(news => (
                <div
                  key={news.id}
                  className="hero-side-card"
                  onClick={() => handleArticleClick(news)}
                >
                  <ImageWithFallback
                    news={news}
                    style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                    showCaption={false}
                  />
                  <div className="hero-overlay">
                    <span
                      className="hero-cat"
                      style={{ background: REPORTERS.find(r => r.id === news.reporter)?.color }}
                    >
                      {news.cat}
                    </span>
                    <h2 className="hero-title">{news.title}</h2>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="main-layout">
          <div>
            <div className="news-section">
              <h2 className="section-title">
                {activeCategory !== 'Todas' ? activeCategory :
                 activeYear ? `Noticias ${activeYear}` : 'Ultimas Noticias'}
                <span className="section-count">{filteredNews.length} articulos</span>
              </h2>

              {activeYear && groupedByMonth ? (
                groupedByMonth.map(group => (
                  <div key={group.month}>
                    <div className="month-label">{group.label} {activeYear}</div>
                    <div className="news-grid">
                      {group.articles.map(news => (
                        <NewsCard key={news.id} news={news} onClick={handleArticleClick} />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="news-grid">
                  {restNews.map(news => (
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
          </div>

          <aside className="sidebar">
            <div className="sidebar-box">
              <h3 className="sidebar-title">Ultimas Noticias</h3>
              {latestNews.map(news => (
                <div
                  key={news.id}
                  className="sidebar-news-item"
                  onClick={() => handleArticleClick(news)}
                >
                  <div className="sidebar-news-title">{news.title}</div>
                  <div className="sidebar-news-meta">{news.cat} · {news.year}</div>
                </div>
              ))}
            </div>

            <div className="sidebar-box reporter-of-day">
              <h3 className="sidebar-title">Reportero del Dia</h3>
              <div className="reporter-avatar-lg" style={{ background: todayReporter.color }}>
                {todayReporter.avatar}
              </div>
              <div className="reporter-name" style={{ marginBottom: 4 }}>{todayReporter.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: 8 }}>
                @{todayReporter.alias}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: todayReporter.color }}>
                {todayReporter.specialty}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#555', marginTop: 8, lineHeight: 1.5 }}>
                {todayReporter.bio}
              </p>
            </div>

            <div className="sidebar-box">
              <h3 className="sidebar-title">Categorias</h3>
              {['Politica', 'Tecnologia', 'Videojuegos', 'Festividades', 'Noticias Locales', 'Internacional'].map(cat => {
                const count = allNews.filter(n => n.cat === cat).length
                return (
                  <div
                    key={cat}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '6px 0', fontSize: '0.85rem',
                      cursor: 'pointer', borderBottom: '1px solid #f0f0f0'
                    }}
                    onClick={() => { setActiveCategory(cat); window.scrollTo(0, 0) }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{ width: 10, height: 10, borderRadius: 2, display: 'inline-block' }}
                        className={`cat-bar-${getCatClass(cat)}`}
                      />
                      {cat}
                    </span>
                    <span style={{ color: '#999', fontWeight: 600 }}>{count}</span>
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
        <strong>Mundoscopio</strong> es un noticiero digital peruano potenciado por
        inteligencia artificial, fundado el 23 de marzo de 2018 en Chimbote, Ancash.
      </p>
      <p>
        Nuestro equipo esta conformado por 6 reporteros de IA, cada uno especializado
        en una categoria informativa: Politica, Tecnologia, Videojuegos, Festividades,
        Noticias Locales (con enfoque en Ancash y el norte del Peru) e Internacional.
      </p>
      <p>
        Todas las noticias publicadas en Mundoscopio estan basadas en eventos reales,
        parafraseadas con estilo editorial propio. Utilizamos inteligencia artificial
        para asistir en la redaccion, pero cada articulo se fundamenta en fuentes
        periodisticas verificables como El Comercio, La Republica, RPP, BBC Mundo,
        entre otras.
      </p>
      <p>
        Mundoscopio nacio con la vision de democratizar el acceso a la informacion
        desde una perspectiva local, conectando Chimbote y Ancash con el Peru y el mundo.
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
      <Ticker news={[...allNews].sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0))} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articulo/:id" element={<ArticlePage />} />
        <Route path="/reporteros" element={<ReportersPage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="/terminos" element={<TerminosPage />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
      <Footer />
    </>
  )
}
