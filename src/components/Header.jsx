import { Link, useLocation, useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const isHome = location.pathname === '/'

  const now = new Date()
  const dateStr = `${now.getDate()} de ${MONTHS[now.getMonth() + 1]} de ${now.getFullYear()}`

  const handleCategoryClick = (cat) => {
    if (isHome && onCategoryChange) {
      onCategoryChange(cat)
    } else {
      // Navigate to home with category param
      navigate(cat === 'Todas' ? '/' : `/?cat=${encodeURIComponent(cat)}`)
    }
  }

  return (
    <header className="site-header">
      <div className="container">
        <div className="header-top">
          <div>
            <Link to="/">
              <h1 className="masthead">ClavNacional</h1>
            </Link>
            <div className="masthead-sub">Noticiero Digital Peruano</div>
          </div>
          <div className="header-date">
            <div>{dateStr}</div>
            <div style={{ fontSize: '0.7rem', marginTop: 2 }}>Desde 2018 | Chimbote, Perú</div>
          </div>
        </div>
        <nav className="header-nav">
          {CATEGORIES.map(cat => (
            <span
              key={cat}
              className={`nav-link ${isHome && activeCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat === 'Politica' ? 'Política' :
               cat === 'Tecnologia' ? 'Tecnología' :
               cat === 'Noticias Locales' ? 'Locales' : cat}
            </span>
          ))}
          <Link to="/acerca" className="nav-link">Acerca</Link>
        </nav>
      </div>
    </header>
  )
}
