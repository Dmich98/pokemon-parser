import type { HttpClient } from '@services';

export abstract class BaseScrapper<P, Args extends unknown[]> {
  constructor(
    protected readonly client: HttpClient,
    protected readonly parser: new (html: string) => P,
  ) {}

  abstract scrape(...args: Args): Promise<unknown>;
}
