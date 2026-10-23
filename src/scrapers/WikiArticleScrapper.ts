import type { WikiArticle, WikiScrapeResult } from '@models';
import type { WikiArticleParser } from '@parsers';

import { BaseScrapper } from './BaseScrapper';

type ScrapeOptions = {
  targetUrl?: string;
  maxPages?: number;
};

export class WikiArticleScrapper extends BaseScrapper<
  WikiArticleParser,
  [url: string, options?: ScrapeOptions]
> {
  async scrape(
    url: string,
    { targetUrl, maxPages = 100 }: ScrapeOptions = {},
  ): Promise<WikiScrapeResult> {
    const articles = new Map<string, WikiArticle>();

    const resultWithReason = (reason: WikiScrapeResult['reason']): WikiScrapeResult => ({
      articles: [...articles.values()],
      reason,
    });

    let currentUrl = url;

    for (let page = 0; page < maxPages; page++) {
      const html = await this.client.get(currentUrl);

      if (html === undefined) {
        throw new Error(`article not found ${currentUrl}`);
      }

      const parser = new this.parser(html).parse();
      const article = parser.getData();

      if (articles.has(article.url)) return resultWithReason('cycle');

      articles.set(article.url, article);

      if (article.url === targetUrl) return resultWithReason('target');

      const href = parser.firstLinkOnPage;

      if (href === undefined) return resultWithReason('no-link');

      currentUrl = new URL(href, article.url).href;
    }

    return resultWithReason('limit');
  }
}
