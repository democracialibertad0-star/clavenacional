import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('ms_cookies_accepted')
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('ms_cookies_accepted', 'true')
    setVisible(false)
  }

  const handleReject = () => {
    localStorage.setItem('ms_cookies_accepted', 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-banner">
      <div className="cookie-banner-inner">
        <div className="cookie-text">
          <strong>Usamos cookies</strong> para mejorar tu experiencia de navegación,
          analizar el tráfico del sitio y personalizar el contenido.
          Al continuar navegando, aceptas nuestro uso de cookies.{' '}
          <Link to="/cookies" className="cookie-link">Más información</Link>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn cookie-btn-accept" onClick={handleAccept}>
            Aceptar todas
          </button>
          <button className="cookie-btn cookie-btn-reject" onClick={handleReject}>
            Solo esenciales
          </button>
        </div>
      </div>
    </div>
  )
}
