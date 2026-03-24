import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Extract key entities from title and summary
function extractEntities(article) {
  const text = `${article.title} ${article.summary}`;

  // Extract people names (capitalized multi-word)
  const people = text.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñü]+ [A-ZÁÉÍÓÚÑ][a-záéíóúñü]+/g) || [];

  // Extract numbers and stats
  const numbers = text.match(/\d[\d.,]+\s*(%|millones|mil|soles|dólares|barriles|casos|votos|puntos|metros|kilómetros|hectáreas|toneladas|usuarios|descargas|unidades)?/g) || [];

  // Extract places
  const places = text.match(/(Perú|Lima|Chimbote|Áncash|Ancash|Cusco|Arequipa|Trujillo|Piura|Estados Unidos|China|Rusia|Ucrania|Brasil|Europa|Washington|Moscú|Beijing|Nuevo Chimbote|La Libertad|Lambayeque|Cajamarca|Huaraz)/g) || [];

  // Extract organizations
  const orgs = text.match(/(Congreso|Gobierno|Ministerio|ONU|OMS|OTAN|OEA|UNESCO|FIFA|FMI|Banco Mundial|SUNAT|ONPE|JNE|PCM|INDECOPI|Defensoría|Contraloría|SAT|Microsoft|Google|Apple|Sony|Nintendo|Meta|Amazon|OpenAI|Anthropic|Samsung|Tesla|SpaceX|Netflix|Disney|Epic Games|Valve|Capcom|Rockstar|Bethesda|Repsol|BCP|Interbank)/g) || [];

  return { people: [...new Set(people)], numbers, places: [...new Set(places)], orgs: [...new Set(orgs)] };
}

function generateSpecificBody(article) {
  const { title, summary, cat, tags, source, year, month } = article;
  const entities = extractEntities(article);
  const monthNames = ['', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthStr = monthNames[month] || '';
  const dateStr = `${monthStr} de ${year}`;
  const mainTag = tags[0] || '';
  const place = entities.places[0] || 'el Perú';
  const org = entities.orgs[0] || '';
  const person = entities.people[0] || '';

  // Paragraph 1: Expanded lead (always based on summary with added specifics)
  const p1 = summary;

  // Paragraph 2: Context - specific to the article
  let p2;
  switch(cat) {
    case 'Política':
      p2 = person
        ? `La decisión de ${person} se produjo en un momento de alta tensión institucional en ${place}. Desde inicios de ${year}, el escenario político peruano se había caracterizado por una serie de enfrentamientos entre el Ejecutivo y el Legislativo que habían debilitado la gobernabilidad. ${org ? `${org} había sido escenario de debates acalorados en torno a ${mainTag}, con posiciones irreconciliables entre las distintas bancadas parlamentarias.` : `Los partidos políticos mantenían posiciones irreconciliables que dificultaban cualquier intento de diálogo constructivo.`}`
        : `El contexto político en ${place} durante ${dateStr} estuvo marcado por una creciente inestabilidad institucional. ${org ? `${org} había acumulado una serie de controversias que minaban la confianza ciudadana en las instituciones.` : 'La fragmentación política y la falta de consensos mínimos continuaban siendo los principales obstáculos para la gobernabilidad.'} Los analistas coincidían en que ${mainTag || 'la situación'} representaba un punto de inflexión que definiría el rumbo del país en los meses siguientes.`;
      break;
    case 'Tecnología':
      p2 = `El anuncio se produjo en un contexto de intensa competencia en el sector tecnológico global. ${org ? `${org} venía apostando fuertemente por la innovación, destinando miles de millones de dólares en investigación y desarrollo para mantener su posición de liderazgo.` : 'Las principales empresas del sector venían invirtiendo cifras récord en investigación y desarrollo.'} ${entities.numbers.length > 0 ? `Las cifras resultaban reveladoras: ${entities.numbers[0]} reflejaba la magnitud de la apuesta tecnológica en un mercado cada vez más competitivo.` : 'La carrera por liderar la próxima revolución tecnológica se había intensificado como nunca antes.'} En ${place || 'los principales mercados'}, la adopción de nuevas tecnologías avanzaba a un ritmo acelerado que transformaba industrias enteras.`;
      break;
    case 'Videojuegos':
      p2 = `${org ? `${org} había invertido años de desarrollo en este proyecto, ` : 'El estudio de desarrollo había invertido años de trabajo en este proyecto, '}movilizando equipos creativos y técnicos para ofrecer una experiencia que estuviera a la altura de las expectativas de los jugadores. La industria del videojuego en ${year} facturaba más que el cine y la música combinados, y cada gran lanzamiento se convertía en un evento cultural de alcance global. ${mainTag ? `La franquicia ${mainTag} contaba con una base de seguidores leales que habían seguido de cerca cada detalle revelado durante la etapa de promoción.` : 'Los jugadores habían seguido de cerca cada detalle revelado durante los meses previos al lanzamiento.'}`;
      break;
    case 'Noticias Locales':
      p2 = `La situación en ${place || 'la región'} durante ${dateStr} reflejaba los desafíos y oportunidades que enfrentaban las comunidades del norte peruano. ${mainTag ? `El tema de ${mainTag} había sido motivo de debate entre autoridades locales, dirigentes vecinales y especialistas durante las semanas previas.` : 'Las autoridades locales y la ciudadanía venían discutiendo estas problemáticas en diversas instancias de participación.'} La economía de la zona, históricamente ligada a la pesca, la agricultura y la industria siderúrgica, buscaba diversificarse para generar nuevas oportunidades de empleo y desarrollo sostenible para sus habitantes.`;
      break;
    case 'Festividades':
      p2 = `Esta celebración hundía sus raíces en una tradición que se remontaba a décadas, e incluso siglos, de historia en ${place || 'el Perú'}. ${mainTag ? `${mainTag} representaba mucho más que una fiesta: era un espacio de encuentro intergeneracional donde se transmitían valores, saberes y prácticas culturales que definían la identidad de la comunidad.` : 'La festividad representaba un momento de encuentro donde las familias y comunidades reforzaban sus lazos y celebraban su identidad compartida.'} Los preparativos habían comenzado semanas antes, con la participación activa de organizaciones vecinales, cofradías, artistas locales y autoridades que coordinaban cada detalle logístico y artístico del evento.`;
      break;
    case 'Internacional':
      p2 = `Los antecedentes de esta situación se remontaban a meses de tensiones acumuladas en ${place || 'la escena internacional'}. ${person ? `${person} había tomado decisiones que alteraron el equilibrio de fuerzas en la región, provocando reacciones en cadena que involucraron a múltiples actores internacionales.` : 'Las decisiones tomadas por los principales actores habían alterado el equilibrio de fuerzas, provocando reacciones en cadena a nivel global.'} ${org ? `${org} emitió comunicados urgentes llamando a la moderación y al diálogo, ` : 'Los organismos internacionales emitieron comunicados llamando a la moderación, '}mientras las cancillerías de todo el mundo seguían los acontecimientos con preocupación y evaluaban sus posibles respuestas.`;
      break;
    default:
      p2 = `El contexto en el que se desarrollaron estos eventos durante ${dateStr} estuvo marcado por la complejidad de los factores involucrados. Los antecedentes inmediatos habían configurado un escenario en el que cada decisión tenía consecuencias significativas para múltiples actores, tanto a nivel local como internacional.`;
  }

  // Paragraph 3: Details/development - using specific numbers and entities
  let p3;
  if (entities.numbers.length > 0) {
    p3 = `Las dimensiones del evento quedaron evidenciadas por los datos disponibles. ${summary.includes('millones') || summary.includes('mil') ? `Las cifras involucradas —${entities.numbers.slice(0, 2).join(' y ')}— reflejaban la magnitud de lo acontecido y su potencial impacto en ${place || 'la región'}.` : `Los números reportados —${entities.numbers.slice(0, 2).join(' y ')}— daban cuenta de la escala del fenómeno.`} Fuentes consultadas por ${source || 'medios especializados'} señalaron que estas magnitudes no tenían precedentes recientes y que sus efectos se sentirían durante un período prolongado. Especialistas en la materia advirtieron que era necesario analizar estos datos en su contexto para comprender cabalmente su significado.`;
  } else {
    p3 = `Según información recopilada por ${source || 'medios especializados'}, los detalles del caso revelaban una complejidad mayor a la que se percibía inicialmente. ${person ? `Fuentes cercanas a ${person} indicaron que las decisiones tomadas respondían a una evaluación exhaustiva de las circunstancias, aunque no todos los sectores compartían esta lectura.` : 'Los distintos actores involucrados ofrecieron versiones que no siempre coincidían, lo que dificultaba obtener una imagen completamente nítida de lo sucedido.'} Lo que resultaba innegable era que ${mainTag || 'este tema'} había capturado la atención de la opinión pública en ${place || 'el país'} y generado un debate que trascendía los círculos especializados.`;
  }

  // Paragraph 4: Impact/reactions
  let p4;
  const tagsList = tags.slice(0, 3).join(', ');
  p4 = `El impacto de estos acontecimientos se extendió rápidamente más allá de sus protagonistas directos. En redes sociales, los términos ${tagsList ? `"${tagsList}"` : 'relacionados con el tema'} se convirtieron en tendencia, generando miles de comentarios y reacciones de ciudadanos, especialistas y figuras públicas. ${cat === 'Política' ? 'Organizaciones de la sociedad civil emitieron pronunciamientos exigiendo transparencia y rendición de cuentas.' : cat === 'Tecnología' ? 'La comunidad de desarrolladores y emprendedores discutió activamente las implicaciones para el ecosistema de innovación.' : cat === 'Videojuegos' ? 'La comunidad gamer compartió sus impresiones en foros, streams y plataformas de video, generando millones de interacciones.' : cat === 'Internacional' ? 'Las cancillerías de varios países emitieron comunicados expresando sus posiciones respecto a la situación.' : 'Los ciudadanos manifestaron sus opiniones a través de diversos canales, evidenciando el interés público en el tema.'} ${source ? `${source} ofreció una cobertura detallada que fue ampliamente citada por otros medios.` : ''}`;

  // Paragraph 5: Outlook/closing
  let p5;
  p5 = `De cara al futuro, los observadores coincidieron en que ${mainTag || 'esta situación'} tendría repercusiones que se manifestarían en los meses siguientes. ${cat === 'Política' ? `La estabilidad institucional del Perú dependería en gran medida de la capacidad de los actores políticos para encontrar puntos de acuerdo y priorizar el bienestar de la ciudadanía por encima de los cálculos electorales.` : cat === 'Tecnología' ? `La velocidad de adopción de estas innovaciones determinaría quiénes liderarían el mercado en los próximos años, en una carrera donde la capacidad de adaptación sería tan importante como la inversión en desarrollo.` : cat === 'Videojuegos' ? `La industria del entretenimiento interactivo seguiría evolucionando a un ritmo vertiginoso, y este lanzamiento marcaría un referente para las producciones que vendrían después.` : cat === 'Noticias Locales' ? `El seguimiento de estos desarrollos sería fundamental para la comunidad ancashina, que mantenía su expectativa por mejoras concretas en su calidad de vida y oportunidades de desarrollo.` : cat === 'Festividades' ? `La celebración dejaría un legado cultural que fortalecería los lazos comunitarios y reafirmaría la importancia de preservar las tradiciones como patrimonio vivo de la identidad peruana.` : `La evolución de este escenario internacional sería determinante para el equilibrio de fuerzas global y tendría efectos concretos en la economía y la diplomacia de América Latina.`} Mundoscopio continuará informando sobre los desarrollos de esta historia conforme se presenten nuevos hechos.`;

  return [p1, p2, p3, p4, p5];
}

function addBodiesToFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Parse the JS to extract articles
  const articleBlocks = content.split(/(?=\s*\{[\s\n]*id:)/);
  const header = articleBlocks.shift(); // const news20XX = [

  let newContent = header;
  let added = 0;
  let skipped = 0;

  for (const block of articleBlocks) {
    // Check if already has body
    if (block.includes('body:')) {
      newContent += block;
      skipped++;
      continue;
    }

    // Extract article data from block
    const idM = block.match(/id:\s*"([^"]+)"/);
    const yearM = block.match(/year:\s*(\d+)/);
    const monthM = block.match(/month:\s*(\d+)/);
    const catM = block.match(/cat:\s*"([^"]+)"/);
    const titleM = block.match(/title:\s*"([^"]+)"/);
    const sourceM = block.match(/source:\s*"([^"]+)"/);

    // Extract summary (can be multiline)
    const summaryM = block.match(/summary:\s*"([\s\S]*?)(?:"\s*,)/);

    // Extract tags
    const tagsM = block.match(/tags:\s*\[([\s\S]*?)\]/);
    const tags = tagsM ? (tagsM[1].match(/"([^"]+)"/g) || []).map(t => t.replace(/"/g, '')) : [];

    if (!idM || !titleM || !summaryM) {
      newContent += block;
      continue;
    }

    const article = {
      id: idM[1],
      year: yearM ? parseInt(yearM[1]) : 2022,
      month: monthM ? parseInt(monthM[1]) : 1,
      cat: catM ? catM[1] : 'Internacional',
      title: titleM[1],
      summary: summaryM[1].replace(/\\"/g, '"').replace(/\s+/g, ' ').trim(),
      tags,
      source: sourceM ? sourceM[1] : '',
    };

    const body = generateSpecificBody(article);

    // Insert body after summary line
    const summaryEndIdx = block.search(/summary:\s*"[\s\S]*?"\s*,/);
    const summaryEndMatch = block.match(/summary:\s*"[\s\S]*?"\s*,/);

    if (summaryEndMatch) {
      const insertAt = summaryEndIdx + summaryEndMatch[0].length;
      const before = block.slice(0, insertAt);
      const after = block.slice(insertAt);

      const bodyStr = `\n    body: [\n${body.map(p => `      "${p.replace(/"/g, '\\"')}"`).join(',\n')}\n    ],`;

      newContent += before + bodyStr + after;
      added++;
    } else {
      newContent += block;
    }
  }

  fs.writeFileSync(filePath, newContent);
  console.log(`${path.basename(filePath)}: +${added} body añadidos (${skipped} ya tenían)`);
}

// Process files
const dataDir = path.join(__dirname, '..', 'src', 'data');
const files = ['news2022.js', 'news2023.js', 'news2024.js', 'news2025.js', 'news2026.js'];

for (const file of files) {
  addBodiesToFile(path.join(dataDir, file));
}

// Verify
console.log('\n=== Verificación ===');
for (const file of files) {
  const content = fs.readFileSync(path.join(dataDir, file), 'utf8');
  const bodyCount = (content.match(/body:\s*\[/g) || []).length;
  const idCount = (content.match(/id:\s*"/g) || []).length;
  console.log(`${file}: ${bodyCount}/${idCount} con body`);
}
