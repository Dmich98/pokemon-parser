import { resolve } from 'node:path';

import { CatalogParser, PokemonParser } from '@parsers';
import { CatalogScraper, PokemonScraper } from '@scrapers';
import { HttpClient } from '@services';
import { CsvStorage } from '@storage';

const SHOP_URL = 'https://scrapeme.live/shop/';

const client = new HttpClient(100);

const catalogScraper = new CatalogScraper(client, CatalogParser);
const pokemonScraper = new PokemonScraper(client, PokemonParser);

const storage = new CsvStorage();

await catalogScraper.scrape(SHOP_URL);
await pokemonScraper.scrape(catalogScraper.urls);

console.log(catalogScraper.urls);
console.log(pokemonScraper.pokemons);

const outputPath = resolve('output', 'pokemons.csv');

await storage.save(pokemonScraper.pokemons.values().toArray(), outputPath);
