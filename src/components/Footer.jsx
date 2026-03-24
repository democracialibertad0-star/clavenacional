import { Link } from 'react-router-dom'

const CATEGORIAS = [
  { label: 'Política',        slug: 'politica' },
  { label: 'Tecnología',      slug: 'tecnologia' },
  { label: 'Videojuegos',     slug: 'videojuegos' },
  { label: 'Festividades',    slug: 'festividades' },
  { label: 'Noticias Locales', slug: 'locales' },
  { label: 'Internacional',   slug: 'internacional' },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">

        <div className="footer-grid">

          {/* Column 1 — Brand */}
          <div className="footer-col footer-col--brand">
            <span className="footer-logo">Mundoscopio</span>
            <p className="footer-text">
              Noticiero digital peruano. Cubrimos Perú y el mundo desde 2018.
            </p>
            <p className="footer-meta">Fundado en Chimbote, Áncash.</p>
          </div>

          {/* Column 2 — Secciones */}
          <div className="footer-col">
            <h4 className="footer-heading">Secciones</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/reporteros">Reporteros</Link></li>
              <li><Link to="/acerca">Acerca de</Link></li>
              <li><Link to="/newsletter">Newsletter</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
            </ul>
          </div>

          {/* Column 3 — Categorías */}
          <div className="footer-col">
            <h4 className="footer-heading">Categorías</h4>
            <ul className="footer-links">
              {CATEGORIAS.map(({ label, slug }) => (
                <li key={slug}>
                  <Link to={`/?categoria=${slug}`}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div className="footer-col">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/terminos">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad">Política de Privacidad</Link></li>
              <li><Link to="/cookies">Política de Cookies</Link></li>
              <li><Link to="/copyright">Aviso de Copyright</Link></li>
              <li><Link to="/derechos-lector">Derechos del Lector</Link></li>
              <li><Link to="/etica-editorial">Ética Editorial</Link></li>
            </ul>
          </div>

          {/* Column 5 — Acerca de */}
          <div className="footer-col">
            <h4 className="footer-heading">Acerca de</h4>
            <ul className="footer-links">
              <li><Link to="/publicidad">Publicidad</Link></li>
              <li><Link to="/contacto">Contacto</Link></li>
              <li>
                <a href="mailto:mundoscopio@noticiero.pe">
                  mundoscopio@noticiero.pe
                </a>
              </li>
            </ul>
          </div>

        </div>{/* /footer-grid */}

        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <span>© 2018–2026 Mundoscopio. Todos los derechos reservados.</span>
            <span className="footer-bottom-location">Hecho desde Chimbote, Áncash, Perú</span>
          </div>
          <div className="footer-bottom-links">
            <Link to="/terminos">Términos</Link>
            <span className="footer-dot" aria-hidden="true">·</span>
            <Link to="/privacidad">Privacidad</Link>
            <span className="footer-dot" aria-hidden="true">·</span>
            <Link to="/cookies">Cookies</Link>
            <span className="footer-dot" aria-hidden="true">·</span>
            <Link to="/copyright">Copyright</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
