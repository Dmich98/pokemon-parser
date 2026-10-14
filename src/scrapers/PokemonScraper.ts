import type { Pokemon } from '@models';
import type { PokemonParser } from '@parsers';
import type { HttpClient } from '@services';

export class PokemonScraper {
  private readonly collectedPokemons = new Set<Pokemon>();

  constructor(
    private readonly client: HttpClient,
    private readonly parser: typeof PokemonParser,
  ) {}

  async scrape(urls: ReadonlySet<string>): Promise<this> {
    this.collectedPokemons.clear();

    for (const url of urls) {
      console.log(`Scraping ${url}...`);
      const html = await this.client.get(url);

      if (html === undefined) {
        console.warn(`Pokemon not found: ${url}`);
        continue;
      }

      const parsedPokemon = new this.parser(html).parse();
      const pokemonData = parsedPokemon.getData();

      this.collectedPokemons.add(pokemonData);

      console.log(`Scraped ${pokemonData.name}`);
    }

    return this;
  }

  get pokemons(): ReadonlySet<Pokemon> {
    return this.collectedPokemons;
  }
}
