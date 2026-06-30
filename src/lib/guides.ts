import data from '../data/guides.generated.json';

export type Guide = {
  slug: string;
  company: string;
  companySlug: string | null;
  grade: string;
  kind: 'guide' | 'review';
  bankKey: string | null;
  stack: string[];
  summary: string;
  pdf: string;
  cover: string;
  questionCount: number | null;
  topics: string[];
};

export const guides = data.guides as Guide[];
export const guidesStats = {
  count: data.count as number,
  totalQuestions: data.totalQuestions as number,
};

const byCompany = new Map<string, Guide>();
for (const g of guides) if (g.companySlug && !byCompany.has(g.companySlug)) byCompany.set(g.companySlug, g);

export const getGuideForCompany = (slug: string): Guide | undefined => byCompany.get(slug);
export const gradeLabel = (g: Guide) => (g.kind === 'review' ? 'Разбор задачи' : 'Гайд');
