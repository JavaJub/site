import data from '../data/directions.json';
import { getCompany, type Company } from './companies';

export type Direction = {
  slug: string;
  name: string;
  short: string;
  stack: string;
  intro: string;
  companies: string[];
};

export const directions = data.directions as Direction[];
export const getDirection = (slug: string): Direction | undefined => directions.find((d) => d.slug === slug);

// Resolve a direction's company slugs to real Company records (drop unknown ones).
export function directionCompanies(d: Direction): Company[] {
  return d.companies.map((s) => getCompany(s)).filter((c): c is Company => Boolean(c));
}
