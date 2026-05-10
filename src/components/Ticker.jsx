import { useMemo } from 'react'

export function Ticker({ news }) {
  const headlines = useMemo(() => {
    const latest = news.slice(0, 15)
    return latest.map(n => `${n.cat.toUpperCase()}: ${n.title}`)
  }, [news])

  const doubled = [...headlines, ...headlines]

  return (
    <div className="ticker-bar">
      <div className="ticker-label">Clavenacional</div>
      <div className="ticker-content">
        {doubled.map((h, i) => (
          <span key={i}>{h}</span>
        ))}
      </div>
    </div>
  )
}
