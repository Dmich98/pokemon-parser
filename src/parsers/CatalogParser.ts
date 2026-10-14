import { BaseParser } from './BaseParser';

export class CatalogParser extends BaseParser<Set<string>> {
  parse(): this {
    const urls = new Set<string>();
    const $ = this.getParser();

    $('ul.products li.product a.woocommerce-LoopProduct-link').each((_, element) => {
      const href = $(element).attr('href');

      if (href) urls.add(href);
    });

    this.setData(urls);

    return this;
  }
}
