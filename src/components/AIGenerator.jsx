import { useState } from 'react'
import { REPORTERS } from '../data/reporters'

const CATEGORIES = ['Politica', 'Tecnologia', 'Videojuegos', 'Festividades', 'Noticias Locales', 'Internacional']

export function AIGenerator() {
  const [selectedReporter, setSelectedReporter] = useState('r1')
  const [selectedCat, setSelectedCat] = useState('Politica')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const reporter = REPORTERS.find(r => r.id === selectedReporter)

  const handleGenerate = async () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_KEY
    if (!apiKey || apiKey === 'sk-ant-api03-TU_KEY_AQUI') {
      setError('Configura tu API key de Anthropic en el archivo .env (VITE_ANTHROPIC_KEY)')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: `Eres ${reporter.name}, reportero IA especializado en ${reporter.specialty} para Mundoscopio Peru. Genera noticias originales en espanol peruano, parafraseadas de fuentes reales pero con voz editorial propia. NUNCA copies textualmente de ninguna fuente. Responde SOLO con JSON valido sin markdown: { "articles": [{ "title": "string", "summary": "string (2-3 oraciones)", "cat": "${selectedCat}", "year": 2026, "tags": ["string"], "imageQuery": "string (keyword en ingles para Unsplash)", "imageCaption": "string", "source": "string" }] }`,
          messages: [{
            role: 'user',
            content: `Genera 3 noticias de la categoria "${selectedCat}" sobre eventos actuales o recientes. Asegurate de que sean noticias realistas y relevantes para Peru o el mundo.`
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.content[0].text
      const parsed = JSON.parse(text)
      setResult(parsed.articles)
    } catch (e) {
      setError(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ padding: '32px 20px' }}>
      <div className="ai-gen">
        <div className="ai-gen-title">
          <span className="spinner" style={{ animation: 'none', borderTopColor: '#2980B9' }}></span>
          Generador de Noticias IA
        </div>
        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: 16 }}>
          Selecciona un reportero y una categoria para generar noticias con inteligencia artificial.
          Las noticias se generan usando Claude (Anthropic).
        </p>

        <div className="ai-gen-form">
          <select
            className="ai-gen-select"
            value={selectedReporter}
            onChange={e => setSelectedReporter(e.target.value)}
          >
            {REPORTERS.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.specialty})
              </option>
            ))}
          </select>

          <select
            className="ai-gen-select"
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            className="ai-gen-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Noticias'}
          </button>
        </div>

        {loading && (
          <div className="ai-gen-loading" style={{ marginTop: 16 }}>
            <div className="spinner"></div>
            {reporter.name} esta redactando noticias...
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee', border: '1px solid #fcc', color: '#c00', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {result && (
          <div className="ai-gen-result">
            <h4 style={{ marginBottom: 12, fontSize: '0.95rem' }}>
              Noticias generadas por {reporter.name}:
            </h4>
            {result.map((article, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < result.length - 1 ? '1px solid #ddd' : 'none' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: 4 }}>{article.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 4 }}>{article.summary}</p>
                <div style={{ fontSize: '0.72rem', color: '#999' }}>
                  {article.cat} · {article.source} · Tags: {article.tags?.join(', ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
