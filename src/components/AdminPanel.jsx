import { useState, useMemo } from 'react'
import { REPORTERS } from '../data/reporters'
import allNews from '../data/index'

const CATEGORIES = ['Política', 'Tecnología', 'Videojuegos', 'Noticias Locales', 'Festividades', 'Internacional']
const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]
const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
]

const MONTH_NAMES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const emptyArticle = {
  id: '', year: 2026, month: 1, cat: 'Política', reporter: 'r1',
  title: '', summary: '', body: ['', '', '', '', ''],
  tags: [], sourceUrl: '', imageCaption: '', source: '',
  imageLocal: '', imageFallback: '', imageQuery: '',
  hasGallery: false, galleryImages: []
}

function NewsForm({ article, onSave, onCancel }) {
  const [form, setForm] = useState({ ...article })
  const [tagsInput, setTagsInput] = useState(article.tags?.join(', ') || '')
  const [bodyText, setBodyText] = useState(article.body?.join('\n\n') || '')
  const [preview, setPreview] = useState(false)

  const handleSave = () => {
    const saved = {
      ...form,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      body: bodyText.split('\n\n').filter(p => p.trim())
    }
    if (saved.body.length < 5) {
      alert('El artículo debe tener mínimo 5 párrafos')
      return
    }
    if (!saved.title.trim() || !saved.summary.trim()) {
      alert('Título y resumen son obligatorios')
      return
    }
    onSave(saved)
  }

  return (
    <div className="admin-form">
      <div className="admin-form-header">
        <h2>{article.id ? `Editar: ${article.id}` : 'Nueva Noticia'}</h2>
        <div className="admin-form-actions">
          <button className="admin-btn secondary" onClick={() => setPreview(!preview)}>
            {preview ? 'Editar' : 'Vista previa'}
          </button>
          <button className="admin-btn primary" onClick={handleSave}>Guardar</button>
          <button className="admin-btn" onClick={onCancel}>Cancelar</button>
        </div>
      </div>

      {preview ? (
        <div className="admin-preview">
          <div className="admin-preview-cat">{form.cat}</div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', margin: '12px 0' }}>{form.title}</h1>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: 20 }}>{form.summary}</p>
          <div style={{ borderTop: '1px solid #ddd', paddingTop: 16 }}>
            {bodyText.split('\n\n').filter(Boolean).map((p, i) => (
              <p key={i} style={{ marginBottom: '1.2em', lineHeight: 1.7 }}>{p}</p>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} style={{ background: '#eee', padding: '2px 10px', borderRadius: 12, fontSize: '.8rem' }}>{tag}</span>
            ))}
          </div>
        </div>
      ) : (
        <div className="admin-form-grid">
          <div className="admin-form-row">
            <label>ID</label>
            <input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })}
              placeholder="n001" disabled={!!article.id} />
          </div>

          <div className="admin-form-row-group">
            <div className="admin-form-row">
              <label>Año</label>
              <select value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label>Mes</label>
              <select value={form.month} onChange={e => setForm({ ...form, month: Number(e.target.value) })}>
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label>Categoría</label>
              <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="admin-form-row">
              <label>Reportero</label>
              <select value={form.reporter} onChange={e => setForm({ ...form, reporter: e.target.value })}>
                {REPORTERS.map(r => <option key={r.id} value={r.id}>{r.name} ({r.specialty})</option>)}
              </select>
            </div>
          </div>

          <div className="admin-form-row">
            <label>Título</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Título de la noticia..." />
          </div>

          <div className="admin-form-row">
            <label>Resumen</label>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })}
              placeholder="Resumen breve de la noticia..." rows={3} />
          </div>

          <div className="admin-form-row">
            <label>
              Cuerpo del artículo
              <span style={{ fontSize: '.75rem', color: '#999', marginLeft: 8 }}>
                (separa párrafos con línea en blanco, mín. 5 párrafos)
              </span>
            </label>
            <textarea value={bodyText} onChange={e => setBodyText(e.target.value)}
              placeholder="Escribe el artículo aquí...&#10;&#10;Segundo párrafo...&#10;&#10;Tercer párrafo..."
              rows={15} className="admin-body-textarea" />
            <div style={{ fontSize: '.75rem', color: bodyText.split('\n\n').filter(Boolean).length >= 5 ? '#27AE60' : '#C0392B' }}>
              {bodyText.split('\n\n').filter(Boolean).length} párrafos
            </div>
          </div>

          <div className="admin-form-row">
            <label>Tags (separados por coma)</label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
              placeholder="tag1, tag2, tag3..." />
          </div>

          <div className="admin-form-row-group">
            <div className="admin-form-row">
              <label>Fuente</label>
              <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                placeholder="El Comercio, BBC Mundo..." />
            </div>
            <div className="admin-form-row">
              <label>URL Fuente</label>
              <input value={form.sourceUrl} onChange={e => setForm({ ...form, sourceUrl: e.target.value })}
                placeholder="https://..." />
            </div>
          </div>

          <div className="admin-form-row">
            <label>Pie de imagen</label>
            <input value={form.imageCaption} onChange={e => setForm({ ...form, imageCaption: e.target.value })}
              placeholder="Descripción de la imagen..." />
          </div>

          <div className="admin-form-row-group">
            <div className="admin-form-row">
              <label>Imagen local</label>
              <input value={form.imageLocal} onChange={e => setForm({ ...form, imageLocal: e.target.value })}
                placeholder="/images/2026/n450.jpg" />
            </div>
            <div className="admin-form-row">
              <label>Query de imagen</label>
              <input value={form.imageQuery} onChange={e => setForm({ ...form, imageQuery: e.target.value })}
                placeholder="peru politics congress..." />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminPanel() {
  const [news] = useState(() => [...allNews].sort((a, b) => b.year - a.year || (b.month || 0) - (a.month || 0)))
  const [filterYear, setFilterYear] = useState(null)
  const [filterCat, setFilterCat] = useState(null)
  const [filterSearch, setFilterSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [exportData, setExportData] = useState(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const filtered = useMemo(() => {
    let result = news
    if (filterYear) result = result.filter(n => n.year === filterYear)
    if (filterCat) result = result.filter(n => n.cat === filterCat)
    if (filterSearch.trim()) {
      const q = filterSearch.toLowerCase()
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
    }
    return result
  }, [news, filterYear, filterCat, filterSearch])

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const stats = useMemo(() => {
    const withBody = news.filter(n => n.body && n.body.length >= 5).length
    const withImage = news.filter(n => n.imageLocal).length
    const byCat = {}
    const byYear = {}
    news.forEach(n => {
      byCat[n.cat] = (byCat[n.cat] || 0) + 1
      byYear[n.year] = (byYear[n.year] || 0) + 1
    })
    return { total: news.length, withBody, withImage, byCat, byYear }
  }, [news])

  const handleExport = (article) => {
    const json = JSON.stringify(article, null, 2)
    setExportData(json)
  }

  const handleSave = (article) => {
    handleExport(article)
    setEditing(null)
    setCreating(false)
  }

  if (editing) {
    const article = news.find(n => n.id === editing)
    return (
      <div className="admin-panel">
        <NewsForm article={article} onSave={handleSave} onCancel={() => setEditing(null)} />
      </div>
    )
  }

  if (creating) {
    const nextId = `n${String(news.length + 1).padStart(3, '0')}`
    return (
      <div className="admin-panel">
        <NewsForm article={{ ...emptyArticle, id: nextId }} onSave={handleSave} onCancel={() => setCreating(false)} />
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Panel de Control — Mundoscopio</h1>
        <p className="admin-subtitle">Gestión de noticias y contenido editorial</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-number">{stats.total}</div>
          <div className="admin-stat-label">Total noticias</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-number" style={{ color: stats.withBody === stats.total ? '#27AE60' : '#E67E22' }}>
            {stats.withBody}
          </div>
          <div className="admin-stat-label">Con cuerpo (5+ párrafos)</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-number" style={{ color: '#2980B9' }}>{stats.withImage}</div>
          <div className="admin-stat-label">Con imagen local</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-number" style={{ color: '#C0392B' }}>
            {stats.total - stats.withBody}
          </div>
          <div className="admin-stat-label">Sin contenido</div>
        </div>
      </div>

      <div className="admin-stats" style={{ marginTop: 8 }}>
        {Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
          <div key={cat} className="admin-stat-card small" onClick={() => setFilterCat(filterCat === cat ? null : cat)}
            style={{ cursor: 'pointer', border: filterCat === cat ? '2px solid var(--azul)' : undefined }}>
            <div className="admin-stat-number" style={{ fontSize: '1.2rem' }}>{count}</div>
            <div className="admin-stat-label">{cat}</div>
          </div>
        ))}
      </div>

      <div className="admin-toolbar">
        <button className="admin-btn primary" onClick={() => setCreating(true)}>+ Nueva Noticia</button>
        <input
          className="admin-search"
          type="text"
          placeholder="Buscar por título o ID..."
          value={filterSearch}
          onChange={e => { setFilterSearch(e.target.value); setPage(0) }}
        />
        <select className="admin-select" value={filterYear || ''} onChange={e => { setFilterYear(e.target.value ? Number(e.target.value) : null); setPage(0) }}>
          <option value="">Todos los años</option>
          {YEARS.map(y => <option key={y} value={y}>{y} ({stats.byYear[y] || 0})</option>)}
        </select>
        <select className="admin-select" value={filterCat || ''} onChange={e => { setFilterCat(e.target.value || null); setPage(0) }}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="admin-count">{filtered.length} resultados</span>
      </div>

      {exportData && (
        <div className="admin-export-modal">
          <div className="admin-export-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Datos del artículo (JSON)</h3>
              <button className="admin-btn" onClick={() => setExportData(null)}>Cerrar</button>
            </div>
            <p style={{ fontSize: '.8rem', color: '#666', marginBottom: 8 }}>
              Copia este JSON y pégalo en el archivo de datos correspondiente.
            </p>
            <textarea
              className="admin-export-textarea"
              value={exportData}
              readOnly
              rows={20}
              onClick={e => e.target.select()}
            />
            <button className="admin-btn primary" style={{ marginTop: 8 }}
              onClick={() => { navigator.clipboard.writeText(exportData); alert('Copiado al portapapeles') }}>
              Copiar al portapapeles
            </button>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Cat</th>
            <th>Título</th>
            <th>Reportero</th>
            <th>Body</th>
            <th>Img</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {paged.map(n => {
            const reporter = REPORTERS.find(r => r.id === n.reporter)
            const hasBody = n.body && n.body.length >= 5
            return (
              <tr key={n.id}>
                <td className="admin-id">{n.id}</td>
                <td className="admin-date">{n.year}/{MONTH_NAMES[n.month] || '—'}</td>
                <td><span className="admin-cat-badge">{n.cat}</span></td>
                <td className="admin-title-cell">{n.title}</td>
                <td>
                  <span className="admin-reporter-badge" style={{ background: reporter?.color || '#999' }}>
                    {reporter?.avatar || '??'}
                  </span>
                </td>
                <td>
                  <span className={`admin-status ${hasBody ? 'ok' : 'missing'}`}>
                    {hasBody ? `${n.body.length}p` : 'Sin body'}
                  </span>
                </td>
                <td>
                  <span className={`admin-status ${n.imageLocal ? 'ok' : 'missing'}`}>
                    {n.imageLocal ? 'OK' : 'No'}
                  </span>
                </td>
                <td className="admin-actions-cell">
                  <button className="admin-btn-sm" onClick={() => setEditing(n.id)}>Editar</button>
                  <button className="admin-btn-sm" onClick={() => handleExport(n)}>JSON</button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button className="admin-btn-sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page + 1} de {totalPages}</span>
          <button className="admin-btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</button>
        </div>
      )}
    </div>
  )
}
