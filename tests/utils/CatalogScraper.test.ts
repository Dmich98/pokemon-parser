import { describe, expect, it, mock } from 'bun:test';
import { readFileSync } from 'node:fs';

import { CatalogParser } from '../../src/parsers/CatalogParser';
import { CatalogScraper } from '../../src/scrapers/CatalogScraper';
import type { HttpClient } from '../../src/services/HttpClient';

const BASE_URL = 'https://scrapeme.live/shop/';
const PAGE_2_URL = new URL('page/2/', BASE_URL).href;

const catalogHtml = readFileSync(new URL('../fixtures/catalog.html', import.meta.url), 'utf8');

const secondPageHtml = readFileSync(
  new URL('../fixtures/catalog-page-2.html', import.meta.url),
  'utf8',
);

const createScraper = (pages: Record<string, string | undefined>) => {
  const get = mock(async (url: string) => pages[url]);

  const client = { get } as unknown as HttpClient;
  const scraper = new CatalogScraper(client, CatalogParser);

  return { scraper, get };
};

describe('CatalogScraper', () => {
  it('collects URLs across multiple pages', async () => {
    const { scraper, get } = createScraper({
      [BASE_URL]: catalogHtml,
      [PAGE_2_URL]: secondPageHtml,
    });

    await scraper.scrape(BASE_URL, 2);

    expect(scraper.urls).toEqual(
      new Set([
        'https://scrapeme.live/shop/Pikachu/',
        'https://scrapeme.live/shop/Bulbasaur/',
        'https://scrapeme.live/shop/Charmander/',
      ]),
    );

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('removes duplicate URLs', async () => {
    const { scraper } = createScraper({
      [BASE_URL]: catalogHtml,
      [PAGE_2_URL]: secondPageHtml,
    });

    await scraper.scrape(BASE_URL, 2);

    expect(scraper.urls.size).toBe(3);
  });

  it('stops when the next page is missing', async () => {
    const { scraper, get } = createScraper({
      [BASE_URL]: catalogHtml,
      [PAGE_2_URL]: secondPageHtml,
    });

    await scraper.scrape(BASE_URL);

    expect(get).toHaveBeenCalledTimes(3);
    expect(scraper.urls.size).toBe(3);
  });

  it('throws when the first page is missing', async () => {
    const { scraper } = createScraper({});

    expect(scraper.scrape(BASE_URL)).rejects.toThrow(`Catalog not found: ${BASE_URL}`);
  });

  it('stops when a page contains no new URLs', async () => {
    const { scraper, get } = createScraper({
      [BASE_URL]: catalogHtml,
      [PAGE_2_URL]: catalogHtml,
    });

    await scraper.scrape(BASE_URL);

    expect(get).toHaveBeenCalledTimes(2);
    expect(scraper.urls.size).toBe(2);
  });

  it('clears previous results before scraping again', async () => {
    const pages: Record<string, string | undefined> = {
      [BASE_URL]: catalogHtml,
    };

    const { scraper } = createScraper(pages);

    await scraper.scrape(BASE_URL, 1);
    expect(scraper.urls.size).toBe(2);

    pages[BASE_URL] = secondPageHtml;

    await scraper.scrape(BASE_URL, 1);

    expect(scraper.urls).toEqual(
      new Set(['https://scrapeme.live/shop/Charmander/', 'https://scrapeme.live/shop/Pikachu/']),
    );
  });

  it('respects maxPages', async () => {
    const { scraper, get } = createScraper({
      [BASE_URL]: catalogHtml,
      [PAGE_2_URL]: secondPageHtml,
    });

    await scraper.scrape(BASE_URL, 1);

    expect(get).toHaveBeenCalledTimes(1);
    expect(scraper.urls.size).toBe(2);
  });

  it('propagates HTTP errors', async () => {
    const get = mock(async (): Promise<string> => {
      throw new Error('HTTP 500');
    });

    const client = { get } as unknown as HttpClient;
    const scraper = new CatalogScraper(client, CatalogParser);

    expect(scraper.scrape(BASE_URL)).rejects.toThrow('HTTP 500');
  });
});
