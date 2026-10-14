import { CatalogParser } from '@parsers';
import type { HttpClient } from '@services';

export class CatalogScraper {
  private readonly collectedUrls = new Set<string>();

  constructor(
    private readonly client: HttpClient,
    private readonly parser: typeof CatalogParser,
  ) {}

  async scrape(baseUrl: string, maxPages?: number): Promise<this> {
    this.collectedUrls.clear();

    console.log(`Scraping catalog from ${baseUrl}...`);

    for (let page = 1; maxPages === undefined || page <= maxPages; page++) {
      const pageUrl = page === 1 ? baseUrl : new URL(`page/${page}/`, baseUrl).href;

      const html = await this.client.get(pageUrl);

      if (html === undefined) {
        if (page === 1) {
          throw new Error(`Catalog not found: ${pageUrl}`);
        }

        console.log(`Page ${page}: end of catalog`);
        break;
      }

      const parsedUrls = new this.parser(html).parse();

      const previousSize = this.collectedUrls.size;

      this.addUrls(parsedUrls.getData());

      const added = this.collectedUrls.size - previousSize;

      console.log(`Page ${page}: +${added} URLs`);

      if (added === 0) break;
    }

    return this;
  }

  get urls(): ReadonlySet<string> {
    return this.collectedUrls;
  }

  private addUrls(urls: ReadonlySet<string>): void {
    for (const url of urls) {
      this.collectedUrls.add(url);
    }
  }
}
