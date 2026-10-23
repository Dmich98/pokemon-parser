import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { stripVTControlCharacters } from 'node:util';

import { printWalkError, printWalkResult, printWalkStart } from '@cli';

describe('wiki output', () => {
  let chunks: string[];
  let restoreOutput: () => void;
  const output = () => stripVTControlCharacters(chunks.join(''));

  beforeEach(() => {
    chunks = [];
    const spy = spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      chunks.push(String(chunk));
      return true;
    });
    restoreOutput = () => spy.mockRestore();
  });

  afterEach(() => restoreOutput());

  it('displays the actual start URL, target URL, limit, and delay', () => {
    printWalkStart({
      startUrl: 'https://en.wikipedia.org/wiki/Science',
      targetUrl: 'https://en.wikipedia.org/wiki/Knowledge',
      maxPages: 12,
      delayMs: 250,
    });

    expect(output()).toContain('https://en.wikipedia.org/wiki/Science');
    expect(output()).toContain('https://en.wikipedia.org/wiki/Knowledge');
    expect(output()).toContain('12 pages');
    expect(output()).toContain('250 ms');
  });

  it.each([
    ['target', 'SUCCESS', 'Target reached'],
    ['cycle', 'NOT REACHED', 'Cycle detected'],
    ['no-link', 'NOT REACHED', 'No suitable link'],
    ['limit', 'NOT REACHED', 'Page limit reached'],
  ] as const)('reports %s with an explicit status and summary', (reason, status, description) => {
    printWalkResult(
      {
        articles: [{ name: 'Science', url: 'https://en.wikipedia.org/wiki/Science' }],
        reason,
      },
      1250,
    );

    expect(output()).toContain(`${status} · ${description} · 1 articles · 1.3s`);
    expect(output()).not.toContain('End of this route');
  });

  it('prints the route vertically with URLs and marks the start and target', () => {
    const firstUrl = 'https://en.wikipedia.org/wiki/Science';
    const targetUrl = 'https://en.wikipedia.org/wiki/Philosophy';

    printWalkResult(
      {
        articles: [
          { name: 'Science', url: firstUrl },
          { name: 'Philosophy', url: targetUrl },
        ],
        reason: 'target',
      },
      2000,
    );

    const text = output();
    expect(text).toContain('01 Science ● START');
    expect(text).toContain('02 Philosophy ◆ TARGET');
    expect(text).toContain(firstUrl);
    expect(text).toContain(targetUrl);
    expect(text.indexOf(firstUrl)).toBeLessThan(text.indexOf('02 Philosophy'));
    expect(text.indexOf('02 Philosophy')).toBeLessThan(text.indexOf(targetUrl));
    expect(text).toContain('2 articles · 2.0s');
  });

  it('handles an empty route without printing a route heading', () => {
    printWalkResult({ articles: [], reason: 'limit' }, 0);

    expect(output()).toContain('NOT REACHED');
    expect(output()).toContain('0 articles · 0.0s');
    expect(output()).not.toContain('Your route');
  });

  it.each([new Error('Connection reset'), 'Connection reset'])(
    'displays error details and the ERROR status (case %#)',
    (error) => {
      printWalkError(error);

      expect(output()).toContain('Connection reset');
      expect(output()).toContain('ERROR');
    },
  );
});
