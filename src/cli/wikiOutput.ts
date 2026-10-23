import { styleText } from 'node:util';

import { intro, log, note, outro } from '@clack/prompts';
import type { WikiScrapeResult } from '@models';

const reasons: Record<WikiScrapeResult['reason'], string> = {
  target: 'Target reached',
  cycle: 'Cycle detected',
  'no-link': 'No suitable link',
  limit: 'Page limit reached',
};

type WalkSettings = {
  startUrl: string;
  targetUrl: string;
  maxPages: number;
  delayMs: number;
};

export function printWalkStart({ startUrl, targetUrl, maxPages, delayMs }: WalkSettings): void {
  intro(styleText(['bold', 'cyan'], 'Wikipedia / First-link walk'));
  note(
    `Start   ${startUrl}\nTarget  ${targetUrl}\nBudget  ${maxPages} pages · ${delayMs} ms between requests`,
    'The journey',
  );
}

export function printWalkResult(result: WikiScrapeResult, elapsedMs: number): void {
  const seconds = (elapsedMs / 1_000).toFixed(1);
  const reachedTarget = result.reason === 'target';

  if (result.articles.length > 0) {
    log.step(styleText('bold', 'Your route'));
    log.message(
      result.articles
        .map((article, index) => {
          const last = index === result.articles.length - 1;
          const branch = last ? '└─' : '├─';
          const guide = last ? '  ' : '│ ';
          const number = styleText('dim', String(index + 1).padStart(2, '0'));
          const title = styleText(last && reachedTarget ? ['bold', 'green'] : 'bold', article.name);
          const badge =
            last && reachedTarget
              ? styleText('green', ' ◆ TARGET')
              : index === 0
                ? styleText('cyan', ' ● START')
                : '';

          return `${branch} ${number} ${title}${badge}\n${guide}   ${styleText('dim', article.url)}${last ? '' : '\n│'}`;
        })
        .join('\n'),
      { spacing: 0 },
    );
  }

  const status = reachedTarget
    ? styleText(['bold', 'green'], 'SUCCESS')
    : styleText(['bold', 'yellow'], 'NOT REACHED');

  outro(`${status} · ${reasons[result.reason]} · ${result.articles.length} articles · ${seconds}s`);
}

export function printWalkError(error: unknown): void {
  log.error(error instanceof Error ? error.message : String(error));
  outro(styleText(['bold', 'red'], 'ERROR'));
}
