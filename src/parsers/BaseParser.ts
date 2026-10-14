import * as cheerio from 'cheerio';

export abstract class BaseParser<T> {
  private parser?: cheerio.CheerioAPI;
  private data?: T;

  constructor(html: string) {
    this.parser = cheerio.load(html);
    this.data = undefined;

    return this;
  }

  abstract parse(): this;

  protected getParser(): cheerio.CheerioAPI {
    if (!this.parser) {
      throw new Error('HTML document is not loaded');
    }

    return this.parser;
  }

  protected setData(data: T): void {
    this.data = data;
  }

  getData(): T {
    if (this.data === undefined) {
      throw new Error('Document has not been parsed');
    }

    return this.data;
  }
}
