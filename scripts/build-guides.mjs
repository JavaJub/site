// Build the free-guides dataset from the real PDF sample guides.
// Covers live in public/img/guides/<slug>.jpg, PDFs in public/guides/<slug>.pdf
// (both committed). Question counts come from the FREE 728-question bank,
// matched by the guide's bank company key — so every number shown is free content.
//
//   node scripts/build-guides.mjs   ->  src/data/guides.generated.json
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const bank = JSON.parse(readFileSync(resolve(root, 'src/data/questions-bank.json'), 'utf8'));

// Curated metadata — authored from the real guide covers. companySlug links to
// the company hub when one exists; bankKey ties the guide to its free questions.
const GUIDES = [
  { slug: 'sber-middle', company: 'Сбер', companySlug: 'sberbank', grade: 'Middle', kind: 'guide',
    bankKey: 'sber', stack: ['Java Core', 'JVM', 'Collections', 'Multithreading', 'Spring', 'SQL', 'System Design'],
    summary: 'Как устроен отбор, что спрашивают по грейду Middle, реальные кейсы и практические задачи с технических интервью.' },
  { slug: 'alfa-middle', company: 'Альфа-Банк', companySlug: 'alfabank', grade: 'Middle', kind: 'guide',
    bankKey: 'alfa-bank', stack: ['Java 11+', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Docker', 'Kubernetes', 'Microservices'],
    summary: 'Alfa Digital: вопросы, задачи и подготовка к live-coding и техническому интервью на Middle.' },
  { slug: 'vk-middle', company: 'VK', companySlug: 'vk', grade: 'Middle', kind: 'guide',
    bankKey: 'vk', stack: ['Java 21', 'Spring Boot 3', 'Kafka', 'PostgreSQL', 'Kubernetes', 'gRPC', 'HAProxy'],
    summary: 'Группа балансеров · One-cloud: что спрашивают на собесе VK и как готовиться к live-coding.' },
  { slug: 'yandex-travel-middle', company: 'Яндекс Путешествия', companySlug: null, grade: 'Middle', kind: 'guide',
    bankKey: 'yandex-travel', stack: ['Java', 'Kotlin', 'Spring Boot', 'PostgreSQL', 'YDB', 'gRPC', 'Kubernetes'],
    summary: 'Яндекс Вертикали: вопросы и задачи с собеседования Java Middle в Путешествиях.' },
  { slug: 't1-innotech', company: 'Т1 Иннотех', companySlug: 't1', grade: 'Junior–Middle', kind: 'guide',
    bankKey: 't1-innotech', stack: ['Java', 'Spring Boot', 'Hibernate', 'PostgreSQL', 'Kafka', 'Docker', 'Microservices'],
    summary: 'Подготовка к live-coding и техническому интервью в Т1 Иннотех для Junior и Middle.' },
  { slug: 'liga-middle', company: 'Лига Цифровой Экономики', companySlug: 'liga-tsifrovoy-ekonomiki', grade: 'Middle', kind: 'guide',
    bankKey: 'liga', stack: ['Java 11+', 'Spring', 'Hibernate', 'PostgreSQL', 'JUnit', 'Docker', 'Jenkins'],
    summary: 'Вопросы, задачи и подготовка к live-coding и интервью в Лигу Цифровой Экономики.' },
  { slug: 'mts-bank-aqa', company: 'МТС Банк · AQA', companySlug: 'mts-bank', grade: 'AQA Junior', kind: 'guide',
    bankKey: 'mts-bank-aqa', stack: ['Java', 'Rest Assured', 'JUnit 5', 'PostgreSQL', 'Kafka', 'WireMock', 'Allure'],
    summary: 'AQA Java: вопросы по автотестам, API-тестированию и Java для собеседования в МТС Банк.' },
  { slug: 'itk-academy-junior', company: 'ITK Academy', companySlug: null, grade: 'Junior', kind: 'guide',
    bankKey: 'itk-academy', stack: ['Java', 'Spring', 'Spring Boot', 'Docker', 'SQL', 'Git', 'OAuth'],
    summary: 'Подготовка к первому техническому интервью: что спрашивают Junior-Java в ITK Academy.' },
  { slug: 'sberseasons-trainee', company: 'Сбер · SberSeasons', companySlug: 'sberbank', grade: 'Стажировка', kind: 'guide',
    bankKey: 'sberseasons', stack: ['Java Core', 'ООП', 'Коллекции', 'SQL', 'Алгоритмы', 'Spring', 'Git'],
    summary: 'Студенческая стажировка SberSeasons: вопросы и задачи для интервью Java-стажёра.' },
  { slug: 'x5-code-review-senior', company: 'X5 Tech', companySlug: 'x5tech', grade: 'Senior', kind: 'review',
    bankKey: 'x5-tech', stack: ['Code Review', 'Алгоритмы', 'Java', 'Senior'],
    summary: 'Разбор задачи на код-ревью под Senior: «Чёрная пятница в Пятёрочке» — найди баги в сервисе скидок.' },
  { slug: 'biznes-tehnologii-junior', company: 'Бизнес Технологии', companySlug: null, grade: 'Junior', kind: 'guide',
    bankKey: null, stack: ['Java SE', 'ООП', 'Коллекции', 'HTTP', 'PostgreSQL', 'Алгоритмы', 'Деревья', 'REST'],
    summary: 'Global ERP (альтернатива SAP): вопросы и задачи для собеседования Junior-Java, Часть 1.' },
];

// Free-bank question counts + covered topics per bankKey.
const byKey = new Map();
for (const q of bank.questions) {
  for (const c of (q.companies || [])) {
    if (!byKey.has(c)) byKey.set(c, { count: 0, topics: new Set() });
    const e = byKey.get(c);
    e.count++;
    for (const t of (q.topics || [])) e.topics.add(t === 'testing-aqa' ? 'testing' : t);
  }
}

const guides = GUIDES.map((g) => {
  const stat = g.bankKey ? byKey.get(g.bankKey) : null;
  return {
    ...g,
    pdf: `/guides/${g.slug}.pdf`,
    cover: `/img/guides/${g.slug}.jpg`,
    questionCount: stat ? stat.count : null,
    topics: stat ? [...stat.topics] : [],
  };
});

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  count: guides.length,
  totalQuestions: guides.reduce((n, g) => n + (g.questionCount || 0), 0),
  guides,
};
writeFileSync(resolve(root, 'src/data/guides.generated.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`✓ ${guides.length} guides, ${out.totalQuestions} free questions ->  src/data/guides.generated.json`);
for (const g of guides) console.log(`  ${g.slug.padEnd(26)} ${String(g.questionCount ?? '—').padStart(4)}  ${g.company}`);
