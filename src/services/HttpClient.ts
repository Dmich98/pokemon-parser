import type { KyInstance } from 'ky';
import ky, { HTTPError } from 'ky';

export class HttpClient {
  private readonly client: KyInstance;
  constructor(
    private readonly delayMs: number = 1_000,
    private readonly timeoutMs: number = 10_000,
  ) {
    this.client = ky.create({
      timeout: this.timeoutMs,
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

  async get(url: string): Promise<string | undefined> {
    await Bun.sleep(this.delayMs);

    try {
      return await this.client.get(url).text();
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 404) {
        return undefined;
      }

      throw error;
    }
  }
}
