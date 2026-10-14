import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

import { CatalogParser } from '../../src/parsers/CatalogParser';

const html = readFileSync(new URL('../fixtures/catalog.html', import.meta.url), 'utf8');

describe('CatalogParser', () => {
  it('extracts unique product URLs', () => {
    const urls = new CatalogParser(html).parse().getData();

    expect(urls).toEqual(
      new Set(['https://scrapeme.live/shop/Pikachu/', 'https://scrapeme.live/shop/Bulbasaur/']),
    );
  });

  it('returns an empty set for an empty document', () => {
    const urls = new CatalogParser('').parse().getData();

    expect(urls.size).toBe(0);
  });

  it('ignores links without href', () => {
    const document = `
      <ul class="products">
        <li class="product">
          <a class="woocommerce-LoopProduct-link">Pikachu</a>
        </li>
      </ul>
    `;

    const urls = new CatalogParser(document).parse().getData();

    expect(urls.size).toBe(0);
  });
});
