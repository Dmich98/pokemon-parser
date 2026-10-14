import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { HTTPError } from 'ky';

import { HttpClient } from '../../src/services/HttpClient';

let attempts = 0;

const server = Bun.serve({
  port: 0,

  async fetch(request) {
    const url = new URL(request.url);

    switch (url.pathname) {
      case '/success':
        return new Response('<h1>Pikachu</h1>');

      case '/not-found':
        return new Response('Not Found', { status: 404 });

      case '/bad-request':
        return new Response('Bad Request', { status: 400 });

      case '/retry':
        attempts++;

        return attempts === 1
          ? new Response('Service Unavailable', { status: 503 })
          : new Response('<h1>Success</h1>');

      case '/headers':
        return new Response(request.headers.get('user-agent'));

      case '/slow':
        await Bun.sleep(500);

        return new Response('Too late');

      default:
        return new Response('Not Found', { status: 404 });
    }
  },
});

const client = new HttpClient(0);
const url = (path: string) => new URL(path, server.url).href;

describe('HttpClient', () => {
  beforeAll(() => {
    attempts = 0;
  });

  afterAll(() => {
    server.stop(true);
  });

  it('returns HTML for successful requests', async () => {
    const html = await client.get(url('/success'));

    expect(html).toBe('<h1>Pikachu</h1>');
  });

  it('returns undefined for HTTP 404', async () => {
    const html = await client.get(url('/not-found'));

    expect(html).toBeUndefined();
  });

  it('throws for HTTP 400', async () => {
    expect(client.get(url('/bad-request'))).rejects.toBeInstanceOf(HTTPError);
  });

  it('retries temporary server errors', async () => {
    attempts = 0;

    const html = await client.get(url('/retry'));

    expect(html).toBe('<h1>Success</h1>');
    expect(attempts).toBe(2);
  });

  it('sends the configured User-Agent', async () => {
    const userAgent = await client.get(url('/headers'));

    expect(userAgent).toBe('CatalogParser/1.0 (study project)');
  });

  it('throws when request exceeds timeout', async () => {
    const client = new HttpClient(0, 100);

    expect(client.get(url('/slow'))).rejects.toMatchObject({
      name: 'TimeoutError',
    });
  });
});
