import { describe, expect, it, mock } from 'bun:test';
import { readFileSync } from 'node:fs';

import { PokemonParser } from '../../src/parsers/PokemonParser';
import { PokemonScraper } from '../../src/scrapers/PokemonScraper';
import type { HttpClient } from '../../src/services/HttpClient';

const PIKACHU_URL = 'https://scrapeme.live/shop/Pikachu/';
const BULBASAUR_URL = 'https://scrapeme.live/shop/Bulbasaur/';
const MISSING_URL = 'https://scrapeme.live/shop/Missing/';

const pikachuHtml = readFileSync(new URL('../fixtures/pokemon.html', import.meta.url), 'utf8');

const bulbasaurHtml = readFileSync(new URL('../fixtures/bulbasaur.html', import.meta.url), 'utf8');

const createScraper = (pages: Record<string, string | undefined>) => {
  const get = mock(async (url: string) => pages[url]);

  const client = { get } as unknown as HttpClient;
  const scraper = new PokemonScraper(client, PokemonParser);

  return { scraper, get };
};

describe('PokemonScraper', () => {
  it('collects pokemon data from multiple URLs', async () => {
    const { scraper, get } = createScraper({
      [PIKACHU_URL]: pikachuHtml,
      [BULBASAUR_URL]: bulbasaurHtml,
    });

    await scraper.scrape(new Set([PIKACHU_URL, BULBASAUR_URL]));

    expect([...scraper.pokemons]).toEqual([
      {
        name: 'Pikachu',
        price: 37,
        description: 'Electric Pokémon',
        sku: '123',
        stock: 42,
      },
      {
        name: 'Bulbasaur',
        price: 45,
        description: 'Seed Pokémon',
        sku: '456',
        stock: 18,
      },
    ]);

    expect(get).toHaveBeenCalledTimes(2);
  });

  it('skips missing pokemon pages', async () => {
    const { scraper } = createScraper({
      [PIKACHU_URL]: pikachuHtml,
    });

    await scraper.scrape(new Set([MISSING_URL, PIKACHU_URL]));

    expect(scraper.pokemons.size).toBe(1);
    expect([...scraper.pokemons][0]?.name).toBe('Pikachu');
  });

  it('returns an empty set for an empty URL collection', async () => {
    const { scraper, get } = createScraper({});

    await scraper.scrape(new Set());

    expect(scraper.pokemons.size).toBe(0);
    expect(get).not.toHaveBeenCalled();
  });

  it('clears previous results before scraping again', async () => {
    const pages: Record<string, string | undefined> = {
      [PIKACHU_URL]: pikachuHtml,
    };

    const { scraper } = createScraper(pages);

    await scraper.scrape(new Set([PIKACHU_URL]));

    pages[BULBASAUR_URL] = bulbasaurHtml;

    await scraper.scrape(new Set([BULBASAUR_URL]));

    expect(scraper.pokemons.size).toBe(1);
    expect([...scraper.pokemons][0]?.name).toBe('Bulbasaur');
  });

  it('propagates HTTP errors', async () => {
    const get = mock(async (): Promise<string> => {
      throw new Error('HTTP 500');
    });

    const client = { get } as unknown as HttpClient;
    const scraper = new PokemonScraper(client, PokemonParser);

    expect(scraper.scrape(new Set([PIKACHU_URL]))).rejects.toThrow('HTTP 500');
  });
});
