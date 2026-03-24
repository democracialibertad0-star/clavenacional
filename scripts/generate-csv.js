import fs from 'fs'

async function main() {
  const data = await import('../src/data/index.js')
  const allNews = data.default
  
  let csv = 'ID,Ano,Mes,Categoria,Reportero,Titulo,Fuente,SourceURL,TieneFoto\n'
  
  for (const n of allNews) {
    const hasImg = fs.existsSync(`public/images/${n.year}/${n.id}.jpg`)
    const titulo = n.title.replace(/,/g, ';').replace(/"/g, "'")
    const url = (n.sourceUrl || '').replace(/,/g, '%2C')
    csv += `${n.id},${n.year},${n.month || ''},${n.cat},${n.reporter},"${titulo}",${n.source},${url},${hasImg ? 'SI' : 'NO'}\n`
  }
  
  fs.writeFileSync('organizacion-noticias.csv', csv)
  
  // Stats
  const byYear = {}
  const byCat = {}
  let withBody = 0
  let withPhoto = 0
  
  for (const n of allNews) {
    byYear[n.year] = (byYear[n.year] || 0) + 1
    byCat[n.cat] = (byCat[n.cat] || 0) + 1
    if (n.body && n.body.length >= 5) withBody++
    if (fs.existsSync(`public/images/${n.year}/${n.id}.jpg`)) withPhoto++
  }
  
  console.log('\n=== ESTADO ACTUAL DEL PROYECTO ===\n')
  console.log('POR ANO:')
  Object.entries(byYear).sort(([a],[b]) => a-b).forEach(([y,c]) => console.log(`  ${y}: ${c} noticias`))
  console.log(`\nTOTAL: ${allNews.length} noticias`)
  console.log(`\nPOR CATEGORIA:`)
  Object.entries(byCat).sort(([,a],[,b]) => b-a).forEach(([c,n]) => console.log(`  ${c}: ${n}`))
  console.log(`\nCONTENIDO:`)
  console.log(`  Con body (5+ parrafos): ${withBody}/${allNews.length}`)
  console.log(`  Con foto scrapeada: ${withPhoto}/${allNews.length}`)
  console.log(`  Sin body: ${allNews.length - withBody}`)
  console.log(`  Sin foto: ${allNews.length - withPhoto}`)
  console.log('\nCSV guardado en: organizacion-noticias.csv')
}

main()
