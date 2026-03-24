import { useState, useEffect } from 'react'

export function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('ms_newsletter_dismissed')
    if (dismissed) return

    // Show after cookies banner is dismissed (3s delay)
    const timer = setTimeout(() => setVisible(true), 3500)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    localStorage.setItem('ms_newsletter_dismissed', Date.now().toString())
    setVisible(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    localStorage.setItem('ms_newsletter_dismissed', 'subscribed')
    setTimeout(() => setVisible(false), 2500)
  }

  if (!visible) return null

  return (
    <div className="nl-overlay" onClick={handleClose}>
      <div className="nl-popup" onClick={e => e.stopPropagation()}>
        <button className="nl-close" onClick={handleClose} aria-label="Cerrar">×</button>

        {subscribed ? (
          <div className="nl-success">
            <div className="nl-success-icon">✓</div>
            <h3>¡Gracias por suscribirte!</h3>
            <p>Recibirás nuestro newsletter cada semana.</p>
          </div>
        ) : (
          <>
            <div className="nl-header">
              <span className="nl-badge">Newsletter</span>
              <h2 className="nl-title">No te pierdas ninguna noticia</h2>
              <p className="nl-desc">
                Recibe cada domingo un resumen con las noticias más importantes de la semana
                directamente en tu correo electrónico. Sin spam, solo información.
              </p>
            </div>

            <form className="nl-form" onSubmit={handleSubmit}>
              <input
                type="email"
                className="nl-email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="nl-submit">Suscribirme gratis</button>
            </form>

            <p className="nl-privacy">
              Al suscribirte aceptas nuestra política de privacidad. Puedes cancelar en cualquier momento.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
