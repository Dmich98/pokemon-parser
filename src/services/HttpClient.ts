import type { KyInstance } from 'ky';
import ky from 'ky';

export class HttpClient {
  private readonly client: KyInstance;

  constructor() {
    this.client = ky.create({
      retry: {
        limit: 1,
        methods: ['get'],
        statusCodes: [500, 502, 503, 504],
      },
      headers: {
        'User-Agent': 'CatalogParser/1.0 (study project)',
      },
    });
  }

  async get(url: string): Promise<string> {
    await Bun.sleep(1000);

    return this.client.get(url).text();
  }
}
