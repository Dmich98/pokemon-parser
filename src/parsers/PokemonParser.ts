import type { Pokemon } from '@models';
import { normalize } from '@utils';
import type { Element } from 'domhandler';

import { BaseParser } from './BaseParser';

export class PokemonParser extends BaseParser<Pokemon> {
  parse(): this {
    const $ = this.getParser();

    const extractText = (element: Element): string => $(element).text().trim();

    const parsed = $.extract({
      name: {
        selector: 'h1.product_title.entry-title',
        value: extractText,
      },
      price: {
        selector: 'span.woocommerce-Price-amount.amount > bdi',
        value: (element) => {
          const price = $(element).clone();

          price.find('.woocommerce-Price-currencySymbol').remove();

          return price.text().trim();
        },
      },
      description: {
        selector: 'div.woocommerce-product-details__short-description > p',
        value: extractText,
      },
      sku: {
        selector: 'span.sku',
        value: extractText,
      },
      stock: {
        selector: 'p.stock.in-stock',
        value: (element) => $(element).text().replace(/\D/g, ''),
      },
    });

    const pokemon: Pokemon = {
      name: normalize.string(parsed.name),
      price: normalize.number(parsed.price),
      description: normalize.string(parsed.description),
      sku: normalize.string(parsed.sku),
      stock: normalize.number(parsed.stock),
    };

    this.setData(pokemon);

    return this;
  }
}
