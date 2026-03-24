import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4 className="footer-title">Mundoscopio</h4>
            <p className="footer-text">
              Noticiero digital peruano potenciado por inteligencia artificial.
              Cubrimos Peru y el mundo desde 2018 con un equipo de 6 reporteros IA
              especializados en politica, tecnologia, videojuegos, festividades,
              noticias locales e internacional.
            </p>
          </div>
          <div>
            <h4 className="footer-title">Secciones</h4>
            <ul className="footer-links">
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/reporteros">Reporteros</Link></li>
              <li><Link to="/acerca">Acerca de</Link></li>
            </ul>
            <h4 className="footer-title" style={{ marginTop: 16 }}>Categorias</h4>
            <ul className="footer-links">
              <li><a href="#">Politica</a></li>
              <li><a href="#">Tecnologia</a></li>
              <li><a href="#">Videojuegos</a></li>
              <li><a href="#">Festividades</a></li>
              <li><a href="#">Noticias Locales</a></li>
              <li><a href="#">Internacional</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/terminos">Terminos y Condiciones</Link></li>
              <li><Link to="/privacidad">Politica de Privacidad</Link></li>
              <li><Link to="/cookies">Politica de Cookies</Link></li>
            </ul>
            <h4 className="footer-title" style={{ marginTop: 16 }}>Contacto</h4>
            <ul className="footer-links">
              <li><a href="mailto:mundoscopio@noticiero.pe">mundoscopio@noticiero.pe</a></li>
              <li><span style={{ color: '#aaa', fontSize: '0.82rem' }}>Nuevo Chimbote, Ancash, Peru</span></li>
              <li><span style={{ color: '#aaa', fontSize: '0.82rem' }}>Fundado: 23 de marzo de 2018</span></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          Mundoscopio 2018-2026. Todos los derechos reservados.
          <br />
          Contenido editorial asistido por inteligencia artificial. Hecho desde Chimbote, Ancash, Peru.
          <br />
          <Link to="/terminos" style={{ color: '#888' }}>Terminos</Link>
          {' · '}
          <Link to="/privacidad" style={{ color: '#888' }}>Privacidad</Link>
          {' · '}
          <Link to="/cookies" style={{ color: '#888' }}>Cookies</Link>
        </div>
      </div>
    </footer>
  )
}
