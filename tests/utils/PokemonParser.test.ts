import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

import { PokemonParser } from '../../src/parsers/PokemonParser';

const html = readFileSync(new URL('../fixtures/pokemon.html', import.meta.url), 'utf8');

describe('PokemonParser', () => {
  it('extracts and normalizes pokemon data', () => {
    const pokemon = new PokemonParser(html).parse().getData();

    expect(pokemon).toEqual({
      name: 'Pikachu',
      price: 37,
      description: 'Electric Pokémon',
      sku: '123',
      stock: 42,
    });
  });

  it('handles missing fields', () => {
    const pokemon = new PokemonParser('').parse().getData();

    expect(pokemon).toEqual({
      name: '',
      price: null,
      description: '',
      sku: '',
      stock: null,
    });
  });

  it('throws when price is invalid', () => {
    const invalidHtml = `
      <span class="woocommerce-Price-amount amount">
        <bdi>invalid</bdi>
      </span>
    `;

    expect(() => new PokemonParser(invalidHtml).parse()).toThrow('Invalid number: invalid');
  });
});
