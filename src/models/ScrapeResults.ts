import type { WikiArticle } from './WikiArticle';

export interface WikiScrapeResult {
  articles: WikiArticle[];
  reason: 'target' | 'cycle' | 'no-link' | 'limit';
}
