import type { Pokemon } from '@models';
import type { PokemonParser } from '@parsers';
import type { HttpClient } from '@services';

export class PokemonScraper {
  private readonly scrappedPokemons: Pokemon[] = [];

  constructor(
    private readonly client: HttpClient,
    private readonly parser: typeof PokemonParser,
  ) {}

  async scrape(urls: ReadonlySet<string>): Promise<this> {
    for (const url of urls) {
      console.log(`Scraping ${url}...`);
      const html = await this.client.get(url);

      const parsedPokemon = new this.parser(html).parse();

      this.scrappedPokemons.push(parsedPokemon.getData());

      console.log(`Scraped ${parsedPokemon.getData().name}`);
    }

    return this;
  }

  get pokemons(): readonly Pokemon[] {
    return this.scrappedPokemons;
  }
}
