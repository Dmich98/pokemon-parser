import type { WikiArticle } from '@models';
import { normalize } from '@utils';

import { BaseParser } from './BaseParser';

export class WikiArticleParser extends BaseParser<WikiArticle> {
  parse(): this {
    const $ = this.getParser();

    const parsed = $.extract({
      name: {
        selector: 'h1#firstHeading',
      },
      url: {
        selector: 'link[rel="canonical"]',
        value: 'href',
      },
    });

    const article: WikiArticle = {
      name: normalize.string(parsed.name),
      url: normalize.string(parsed.url),
    };

    this.setData(article);
    return this;
  }

  get firstLinkOnPage(): string | undefined {
    const $ = this.getParser();

    const candidates = $('section[data-mw-section-id] p a[rel~="mw:WikiLink"][href]');

    const excluded = [
      '[typeof~="mw:Transclusion"]',
      '[typeof~="mw:Extension/ref"]',
      '.reference',
      '.mw-ref',
      '.IPA',
    ].join(', ');

    for (const element of candidates.toArray()) {
      const link = $(element);

      if (link.closest(excluded).length > 0) {
        continue;
      }

      return link.attr('href');
    }

    return undefined;
  }
}
