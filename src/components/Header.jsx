import { Link, useLocation } from 'react-router-dom'

const CATEGORIES = [
  'Todas', 'Politica', 'Tecnologia', 'Videojuegos',
  'Festividades', 'Noticias Locales', 'Internacional'
]

const MONTHS = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function Header({ activeCategory, onCategoryChange }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  const now = new Date()
  const dateStr = `${now.getDate()} de ${MONTHS[now.getMonth() + 1]} de ${now.getFullYear()}`

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-top">
          <div>
            <Link to="/">
              <h1 className="masthead">Mundoscopio</h1>
            </Link>
            <div className="masthead-sub">Noticiero Digital Peruano</div>
          </div>
          <div className="header-date">
            <div>{dateStr}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 2 }}>Desde 2018 | Chimbote, Peru</div>
          </div>
        </div>
        <nav className="header-nav">
          {isHome && CATEGORIES.map(cat => (
            <span
              key={cat}
              className={`nav-link ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat)}
            >
              {cat === 'Politica' ? 'Politica' :
               cat === 'Tecnologia' ? 'Tecnologia' :
               cat === 'Noticias Locales' ? 'Locales' : cat}
            </span>
          ))}
          <Link to="/reporteros" className="nav-link">Reporteros</Link>
          <Link to="/acerca" className="nav-link">Acerca</Link>
        </nav>
      </div>
    </header>
  )
}
