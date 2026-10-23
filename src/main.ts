import { printWalkError, printWalkResult, printWalkStart } from '@cli';
import { WikiArticleParser } from '@parsers';
import { WikiArticleScrapper } from '@scrapers';
import { HttpClient } from '@services';

const REQUEST_DELAY_MS = 500;
const MAX_PAGES = 100;
const START_URL = 'https://en.wikipedia.org/wiki/Special:Random';
const TARGET_URL = 'https://en.wikipedia.org/wiki/Philosophy';

const client = new HttpClient(REQUEST_DELAY_MS);
const articleScrapper = new WikiArticleScrapper(client, WikiArticleParser);

printWalkStart({
  startUrl: START_URL,
  targetUrl: TARGET_URL,
  maxPages: MAX_PAGES,
  delayMs: REQUEST_DELAY_MS,
});

const startedAt = performance.now();

try {
  const result = await articleScrapper.scrape(START_URL, {
    targetUrl: TARGET_URL,
    maxPages: MAX_PAGES,
  });

  printWalkResult(result, performance.now() - startedAt);
} catch (error) {
  printWalkError(error);
  process.exitCode = 1;
}
