import { REPORTERS } from '../data/reporters'
import allNews from '../data/index'

export function ReportersPage() {
  return (
    <div className="container reporters-page">
      <h2 className="section-title">Equipo de Reporteros IA</h2>
      <p style={{ color: '#666', marginBottom: 8, fontSize: '0.9rem' }}>
        Nuestro equipo de 6 reporteros de inteligencia artificial cubre Peru y el mundo
        desde 2018. Cada perfil esta especializado en una categoria informativa.
      </p>

      <div className="reporters-grid">
        {REPORTERS.map(reporter => {
          const articleCount = allNews.filter(n => n.reporter === reporter.id).length
          return (
            <div key={reporter.id} className="reporter-card">
              <div
                className="reporter-avatar-lg"
                style={{ background: reporter.color }}
              >
                {reporter.avatar}
              </div>
              <div className="reporter-name">{reporter.name}</div>
              <div className="reporter-alias">@{reporter.alias}</div>
              <div
                className="reporter-specialty"
                style={{ background: reporter.color }}
              >
                {reporter.specialty}
              </div>
              <div className="reporter-origin">{reporter.origin}</div>
              <p className="reporter-bio">{reporter.bio}</p>
              <div className="reporter-stats">
                {articleCount} articulos publicados
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
