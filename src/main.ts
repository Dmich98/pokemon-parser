import { resolve } from 'node:path';

import { CatalogParser, PokemonParser } from '@parsers';
import { CatalogScraper, PokemonScraper } from '@scrapers';
import { HttpClient } from '@services';
import { CsvStorage } from '@storage';

const REQUEST_DELAY_MS = 100;
const SHOP_URL = 'https://scrapeme.live/shop/';

const client = new HttpClient(REQUEST_DELAY_MS);

const catalogScraper = new CatalogScraper(client, CatalogParser);
const pokemonScraper = new PokemonScraper(client, PokemonParser);

await catalogScraper.scrape(SHOP_URL);
await pokemonScraper.scrape(catalogScraper.urls);

const outputPath = resolve('output', 'pokemons.csv');

const storage = new CsvStorage(outputPath);

await storage.save(pokemonScraper.pokemons.values().toArray());
