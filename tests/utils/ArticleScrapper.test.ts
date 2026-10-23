import { describe, expect, it, mock } from 'bun:test';

import { WikiArticleParser } from '../../src/parsers/WikiArticleParser';
import { WikiArticleScrapper } from '../../src/scrapers/WikiArticleScrapper';
import type { HttpClient } from '../../src/services/HttpClient';

const ARTICLE_URL = 'https://en.wikipedia.org/wiki/TypeScript';
const RANDOM_URL = 'https://en.wikipedia.org/wiki/Special:Random';

const articleHtml = (url: string, name: string, nextHref?: string): string => `
  <link rel="canonical" href="${url}">
  <h1 id="firstHeading">${name}</h1>
  <section data-mw-section-id="0">
    <p>${nextHref ? `<a rel="mw:WikiLink" href="${nextHref}">Next</a>` : 'No links'}</p>
  </section>
`;

const createScraper = (pages: Record<string, string>) => {
  const get = mock(async (url: string) => pages[url]);
  const client = { get } as unknown as HttpClient;

  return { scraper: new WikiArticleScrapper(client, WikiArticleParser), get };
};

describe('WikiArticleScrapper', () => {
  it('returns the route with no-link when the article has no suitable links', async () => {
    const get = mock(
      async () => `
        <link rel="canonical" href="${ARTICLE_URL}">
        <h1 id="firstHeading">TypeScript</h1>
      `,
    );
    const client = { get } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    expect(await scraper.scrape(RANDOM_URL)).toEqual({
      articles: [{ name: 'TypeScript', url: ARTICLE_URL }],
      reason: 'no-link',
    });
    expect(get).toHaveBeenCalledWith(RANDOM_URL);
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('resolves the next link against the canonical URL and stops at Philosophy', async () => {
    const targetUrl = 'https://en.wikipedia.org/wiki/Philosophy';
    const pages = new Map([
      [
        RANDOM_URL,
        `<link rel="canonical" href="${ARTICLE_URL}">
         <h1 id="firstHeading">TypeScript</h1>
         <section data-mw-section-id="0">
           <p><a rel="mw:WikiLink" href="./Philosophy">Philosophy</a></p>
         </section>`,
      ],
      [
        targetUrl,
        `<link rel="canonical" href="${targetUrl}">
         <h1 id="firstHeading">Philosophy</h1>`,
      ],
    ]);
    const get = mock(async (url: string) => pages.get(url));
    const client = { get } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    expect(await scraper.scrape(RANDOM_URL, { targetUrl })).toEqual({
      articles: [
        { name: 'TypeScript', url: ARTICLE_URL },
        { name: 'Philosophy', url: targetUrl },
      ],
      reason: 'target',
    });
    expect(get.mock.calls).toEqual([[RANDOM_URL], [targetUrl]]);
  });

  it('accepts a custom target URL', async () => {
    const get = mock(
      async () => `
        <link rel="canonical" href="${ARTICLE_URL}">
        <h1 id="firstHeading">TypeScript</h1>
      `,
    );
    const client = { get } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    expect(await scraper.scrape(RANDOM_URL, { targetUrl: ARTICLE_URL })).toEqual({
      articles: [{ name: 'TypeScript', url: ARTICLE_URL }],
      reason: 'target',
    });
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('accepts a page limit without overriding the target URL', async () => {
    const get = mock(async () => '');
    const client = { get } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    expect(await scraper.scrape(RANDOM_URL, { maxPages: 0 })).toEqual({
      articles: [],
      reason: 'limit',
    });
    expect(get).not.toHaveBeenCalled();
  });

  it('throws when the article is missing', async () => {
    const client = { get: async () => undefined } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    await expect(scraper.scrape(ARTICLE_URL)).rejects.toThrow(`article not found ${ARTICLE_URL}`);
  });

  it('stops immediately when the random starting article is the target', async () => {
    const { scraper, get } = createScraper({
      [RANDOM_URL]: articleHtml(ARTICLE_URL, 'TypeScript', './Unvisited'),
    });

    expect(await scraper.scrape(RANDOM_URL, { targetUrl: ARTICLE_URL })).toEqual({
      articles: [{ name: 'TypeScript', url: ARTICLE_URL }],
      reason: 'target',
    });
    expect(get.mock.calls).toEqual([[RANDOM_URL]]);
  });

  it('detects cycles by canonical URL and omits the repeated article', async () => {
    const secondUrl = 'https://en.wikipedia.org/wiki/JavaScript';
    const aliasUrl = 'https://en.wikipedia.org/wiki/Return_to_TypeScript';
    const { scraper, get } = createScraper({
      [RANDOM_URL]: articleHtml(ARTICLE_URL, 'TypeScript', './JavaScript'),
      [secondUrl]: articleHtml(secondUrl, 'JavaScript', './Return_to_TypeScript'),
      [aliasUrl]: articleHtml(ARTICLE_URL, 'Duplicate title', './Unvisited'),
    });

    expect(await scraper.scrape(RANDOM_URL)).toEqual({
      articles: [
        { name: 'TypeScript', url: ARTICLE_URL },
        { name: 'JavaScript', url: secondUrl },
      ],
      reason: 'cycle',
    });
    expect(get.mock.calls).toEqual([[RANDOM_URL], [secondUrl], [aliasUrl]]);
  });

  it('stops at a positive page limit without fetching the next article', async () => {
    const secondUrl = 'https://en.wikipedia.org/wiki/JavaScript';
    const { scraper, get } = createScraper({
      [RANDOM_URL]: articleHtml(ARTICLE_URL, 'TypeScript', './JavaScript'),
      [secondUrl]: articleHtml(secondUrl, 'JavaScript', './Unvisited'),
    });

    expect(await scraper.scrape(RANDOM_URL, { maxPages: 2 })).toEqual({
      articles: [
        { name: 'TypeScript', url: ARTICLE_URL },
        { name: 'JavaScript', url: secondUrl },
      ],
      reason: 'limit',
    });
    expect(get.mock.calls).toEqual([[RANDOM_URL], [secondUrl]]);
  });

  it('uses the default limit when options are omitted', async () => {
    const get = mock(async (url: string) => {
      const page = Number(new URL(url).pathname.split('/').at(-1));

      return articleHtml(url, `Article ${page}`, `./${page + 1}`);
    });
    const client = { get } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    const result = await scraper.scrape('https://en.wikipedia.org/wiki/0');

    expect(result.reason).toBe('limit');
    expect(result.articles).toHaveLength(100);
    expect(result.articles.at(-1)?.url).toBe('https://en.wikipedia.org/wiki/99');
    expect(get).toHaveBeenCalledTimes(100);
  });

  it.each([
    ['target', ARTICLE_URL, './Unvisited'],
    ['no-link', undefined, undefined],
  ] as const)(
    'returns %s instead of limit on the last allowed page',
    async (reason, targetUrl, href) => {
      const { scraper, get } = createScraper({
        [RANDOM_URL]: articleHtml(ARTICLE_URL, 'TypeScript', href),
      });

      expect(await scraper.scrape(RANDOM_URL, { targetUrl, maxPages: 1 })).toEqual({
        articles: [{ name: 'TypeScript', url: ARTICLE_URL }],
        reason,
      });
      expect(get.mock.calls).toEqual([[RANDOM_URL]]);
    },
  );

  it('includes the failing next URL when a later article is missing', async () => {
    const missingUrl = 'https://en.wikipedia.org/wiki/Missing';
    const { scraper, get } = createScraper({
      [RANDOM_URL]: articleHtml(ARTICLE_URL, 'TypeScript', './Missing'),
    });

    await expect(scraper.scrape(RANDOM_URL)).rejects.toThrow(`article not found ${missingUrl}`);
    expect(get.mock.calls).toEqual([[RANDOM_URL], [missingUrl]]);
  });

  it('propagates the original network error without requesting more pages', async () => {
    const failure = new Error('Connection reset');
    const nextUrl = 'https://en.wikipedia.org/wiki/JavaScript';
    const get = mock(async (url: string) => {
      if (url === RANDOM_URL) return articleHtml(ARTICLE_URL, 'TypeScript', './JavaScript');
      throw failure;
    });
    const client = { get } as unknown as HttpClient;
    const scraper = new WikiArticleScrapper(client, WikiArticleParser);

    await expect(scraper.scrape(RANDOM_URL)).rejects.toBe(failure);
    expect(get.mock.calls).toEqual([[RANDOM_URL], [nextUrl]]);
  });

  it('starts each run with a fresh route and visited URLs', async () => {
    const { scraper, get } = createScraper({
      [RANDOM_URL]: articleHtml(ARTICLE_URL, 'TypeScript', './TypeScript'),
      [ARTICLE_URL]: articleHtml(ARTICLE_URL, 'TypeScript'),
    });

    const first = await scraper.scrape(RANDOM_URL);
    const second = await scraper.scrape(RANDOM_URL);

    expect(first).toEqual({
      articles: [{ name: 'TypeScript', url: ARTICLE_URL }],
      reason: 'cycle',
    });
    expect(second).toEqual(first);
    expect(second.articles).not.toBe(first.articles);
    expect(get.mock.calls).toEqual([[RANDOM_URL], [ARTICLE_URL], [RANDOM_URL], [ARTICLE_URL]]);
  });
});
