// Parses the JavaJub company question base (companies/*.md) into
// structured JSON the Astro site generates pages from.
// Primary source = the "## Банк вопросов" section: `### Grade (N)` headers +
// <details><summary><b>k.</b> question _[topic]_ · встречаемость F · scope</summary> answer…</details>
// Output: src/data/companies.generated.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
// Local-only regen tool: point JAVAJUB_COMPANIES_DIR at your source folder.
// The generated JSON is committed, so this default is only used when regenerating.
const SRC = process.env.JAVAJUB_COMPANIES_DIR || path.resolve(ROOT, '../company-questions');
const OUT = path.join(ROOT, 'src/data/companies.generated.json');

const TOPIC_MAP = [
  [/java\s*core|ооп|generics|\bstring\b|optional|exception|\brecord\b|immutab|equals|hashcode|памят.*объект/i, 'java-core'],
  [/коллекц|collection|hashmap|hashset|arraylist|treemap|\bset\b|\bmap\b|очеред|list\b/i, 'collections'],
  [/\bjvm\b|\bheap\b|\bstack\b|\bgc\b|garbage|classloader|\bjit\b|metaspace|сборщик/i, 'jvm'],
  [/многопоточ|concurrency|\bпоток|volatile|synchronized|atomic|\block\b|executor|\bjmm\b|deadlock|race condition|completablefuture/i, 'concurrency'],
  [/spring|\bbean\b|\bioc\b|\bdi\b|\baop\b|transactional|\bboot\b|conditional|кондишн|rest api|\brest\b|контроллер|\bmvc\b|сервлет|\bhttp\b/i, 'spring'],
  [/hibernate|\bjpa\b|\borm\b|entity|n\+1|persistence|\bfetch\b|lazy|eager|jdbc/i, 'hibernate'],
  [/\bбд\b|\bsql\b|postgres|индекс|\bjoin\b|explain|транзакц|\bmvcc\b|изоляц|базы данных|нормальн|b-tree|rollback|\bacid\b|\bddl\b|\bdml\b|primary key|foreign key|оракл|oracle/i, 'sql'],
  [/kafka|rabbit|очеред|\bbroker|partition|consumer|producer|микросервис|outbox|saga|idempot|брокер/i, 'kafka'],
  [/docker|kubernetes|k8s|\bci\b|\bcd\b|pipeline|деплой|контейнер|monitoring|мониторинг|prometheus|grafana|kibana|\belk\b|jenkins|gitlab|\bgit\b/i, 'devops'],
  [/\bтест|junit|mockito|wiremock|testcontainers|rest assured|\bqa\b|\baqa\b|\bmock\b|тест-дизайн|автоматизац/i, 'testing'],
  [/алгоритм|live\s*coding|\bзадач|leetcode|строк|массив|two pointers|sliding|\bbfs\b|\bdfs\b|\bдерев|\bграф\b|сложност|big-?o|рекурс|сортиров/i, 'algorithms'],
  [/system design|архитектур|rate limit|load balanc|highload|high-load|нагрузк|масштаб|отказоустойч|паттерн|singleton|шаблон проект|маршрутизац|балансир/i, 'system-design'],
  [/security|oauth|\bjwt\b|keycloak|csrf|\bxss\b|owasp|безопасн|аутентифик|авторизац|\btls\b|\bssl\b|сертификат|шифров|хэш парол|хеш парол/i, 'security'],
];
const TOPIC_LABEL = {
  'java-core': 'Java Core', collections: 'Коллекции', jvm: 'JVM',
  concurrency: 'Многопоточность', spring: 'Spring', hibernate: 'Hibernate / JPA',
  sql: 'Базы данных / SQL', kafka: 'Kafka / микросервисы', devops: 'DevOps',
  testing: 'Тестирование', algorithms: 'Алгоритмы', 'system-design': 'System Design',
  security: 'Security', other: 'Прочее',
};
const GRADE_NORM = (g) => {
  const s = g.trim().toLowerCase();
  if (/lead|тимлид/.test(s)) return 'Lead';
  if (/senior|сеньор/.test(s)) return 'Senior';
  if (/middle\s*\+|миддл\s*\+/.test(s)) return 'Middle+';
  if (/middle|миддл/.test(s)) return 'Middle';
  if (/junior\s*\+|джуниор\s*\+/.test(s)) return 'Junior+';
  if (/junior|джуниор|стаж|trainee/.test(s)) return 'Junior';
  if (/общ|без\s*грейд|all/.test(s)) return 'Общие';
  return g.trim();
};

function topicKey(raw, text) {
  const probe = `${raw || ''} ${text || ''}`;
  for (const [re, key] of TOPIC_MAP) if (re.test(probe)) return key;
  return 'other';
}

function stripTags(s) { return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }

function cleanName(heading, slug) {
  let n = heading.replace(/^#\s*/, '')
    .replace(/^Собеседование\s+Java\s+(в|во|на)\s+/i, '')
    .replace(/^Собеседование\s+Java\s*/i, '').trim();
  if (!n || n.length < 2) n = slug;
  return n;
}

function parseSummary(inner) {
  // inner = "<b>1.</b> Текст вопроса _[topic]_ · встречаемость 3 · общий"
  let s = stripTags(inner).replace(/^\d+\.\s*/, '').trim();
  const topicM = s.match(/_\[(.+?)\]_/);
  const rawTopic = topicM ? topicM[1] : '';
  const freqM = s.match(/встречаемость\s*(\d+)/i);
  const freq = freqM ? Number(freqM[1]) : 1;
  // question = text before the first " · " metadata separator, minus the topic tag
  let q = s.replace(/_\[.+?\]_/g, '').split('·')[0].trim();
  q = q.replace(/\s{2,}/g, ' ').trim();
  return { text: q, rawTopic, freq };
}

function parseFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const fileSlug = path.basename(file, '.md');
  const headingLine = lines.find((l) => /^#\s+/.test(l)) || `# ${fileSlug}`;
  const slug = (text.match(/^-\s*slug:\s*`?([a-z0-9-]+)`?/im)?.[1] || fileSlug).trim();
  const name = cleanName(headingLine, slug);
  const source = text.match(/^-\s*url:\s*(\S+)/im)?.[1] || null;
  const interviewCount = Number(text.match(/^##\s*Интервью\s*\((\d+)\)/im)?.[1] || 0);
  const insightCount = Number(text.match(/^##\s*Инсайды\s*\((\d+)\)/im)?.[1] || 0);

  // Walk the "Банк вопросов" section.
  const questions = [];
  let inBank = false;
  let grade = 'Общие';
  for (const line of lines) {
    if (/^##\s/.test(line)) { inBank = /Банк\s+вопросов/i.test(line); continue; }
    if (!inBank) continue;
    const gh = line.match(/^###\s+(.+?)\s*\((\d+)\)\s*$/);
    if (gh) { grade = GRADE_NORM(gh[1]); continue; }
    const sm = line.match(/<summary>(.*?)<\/summary>/i);
    if (sm) {
      const { text: q, rawTopic, freq } = parseSummary(sm[1]);
      if (q && q.length >= 5) {
        questions.push({ grade, topic: topicKey(rawTopic, q), text: q, freq });
      }
    }
  }

  // de-dupe identical questions (keep highest freq)
  const seen = new Map();
  for (const q of questions) {
    const k = q.text.toLowerCase();
    if (!seen.has(k) || seen.get(k).freq < q.freq) seen.set(k, q);
  }
  const uniq = [...seen.values()];

  const grades = {};
  for (const q of uniq) grades[q.grade] = (grades[q.grade] || 0) + 1;
  const topicCounts = {};
  for (const q of uniq) topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;

  // NOTE: raw question TEXT is the paid Java Jub Pro product — it must never ship
  // to the public site. We emit only aggregate metadata (grades, topic mix, counts).
  // The site renders only FREE questions, sourced from src/data/questions-bank.json.
  return {
    slug, name, source,
    grades,
    gradeList: Object.keys(grades),
    totalQuestions: uniq.length,
    interviewCount, insightCount,
    topicCounts,
    topTopics: Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k),
  };
}

function build() {
  if (!fs.existsSync(SRC)) { console.error(`Company source not found: ${SRC}`); process.exit(1); }
  const files = fs.readdirSync(SRC)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => path.join(SRC, f));

  const companies = files.map(parseFile)
    .filter((c) => c.totalQuestions >= 3)
    .sort((a, b) => b.totalQuestions - a.totalQuestions);

  const totalQuestions = companies.reduce((s, c) => s + c.totalQuestions, 0);
  const totalInsights = companies.reduce((s, c) => s + c.insightCount, 0);
  const topicTotals = {};
  for (const c of companies) for (const [k, v] of Object.entries(c.topicCounts)) topicTotals[k] = (topicTotals[k] || 0) + v;

  const payload = {
    stats: { companies: companies.length, questions: totalQuestions, insights: totalInsights, topicTotals },
    topicLabels: TOPIC_LABEL,
    companies,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Parsed ${companies.length} companies, ${totalQuestions} questions → ${path.relative(ROOT, OUT)}`);
}

build();
