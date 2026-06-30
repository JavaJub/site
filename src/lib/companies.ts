import data from '../data/companies.generated.json';

// NOTE: per-company question TEXT is the paid Java Jub Pro product and is NOT
// shipped — companies.generated.json holds aggregate metadata only. The site
// renders only FREE questions (see lib/questions.ts).
export type Company = {
  slug: string;
  name: string;
  source: string | null;
  grades: Record<string, number>;
  gradeList: string[];
  totalQuestions: number;
  interviewCount: number;
  insightCount: number;
  topicCounts: Record<string, number>;
  topTopics: string[];
};

// Company hubs that have a matching FREE sample guide → their own free questions
// in the bank (keyed by bank company id). Everyone else gets topic-based free Qs.
export const FREE_GUIDE_COMPANIES: Record<string, string[]> = {
  sberbank: ['sber', 'sberseasons'],
  alfabank: ['alfa-bank'],
  vk: ['vk'],
  'liga-tsifrovoy-ekonomiki': ['liga'],
  'mts-bank': ['mts-bank-aqa'],
  x5tech: ['x5-tech'],
  t1: ['t1-innotech'],
  innotech: ['t1-innotech'],
};

export const companies: Company[] = data.companies as Company[];
export const stats = data.stats as {
  companies: number;
  questions: number;
  insights: number;
  topicTotals: Record<string, number>;
};
export const topicLabels = data.topicLabels as Record<string, string>;

export const topicLabel = (key: string) => topicLabels[key] ?? key;

export function getCompany(slug: string): Company | undefined {
  return companies.find((c) => c.slug === slug);
}

// Companies with enough real content to deserve an indexable page
// (the pipeline already drops files with < 3 parsed questions).
export const indexableCompanies = companies.filter((c) => c.totalQuestions >= 5);

// nice RU number formatting: 1819 -> "1 819"
export const ru = (n: number) => n.toLocaleString('ru-RU');

// RU plural: pick(n, ['вопрос','вопроса','вопросов'])
export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
  return forms[2];
}
export const qWord = (n: number) => plural(n, ['вопрос', 'вопроса', 'вопросов']);
