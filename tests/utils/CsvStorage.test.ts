import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CsvStorage } from '../../src/storage/CsvStorage';

describe('CsvStorage', () => {
  const storage = new CsvStorage();
  const directories: string[] = [];

  async function createTempDir(): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), 'pokemon-parser-'));
    directories.push(directory);

    return directory;
  }

  afterEach(async () => {
    await Promise.all(
      directories.map((directory) => rm(directory, { recursive: true, force: true })),
    );

    directories.length = 0;
  });

  it('saves records with CSV headers', async () => {
    const directory = await createTempDir();
    const filePath = join(directory, 'pokemons.csv');

    await storage.save(
      [
        {
          name: 'Pikachu',
          price: 37,
          description: 'Electric Pokémon',
          sku: '123',
          stock: 42,
        },
      ],
      filePath,
    );

    const csv = await readFile(filePath, 'utf8');

    expect(csv.trim()).toBe(
      'name,price,description,sku,stock\n' + 'Pikachu,37,Electric Pokémon,123,42',
    );
  });

  it('escapes commas, quotes and newlines', async () => {
    const directory = await createTempDir();
    const filePath = join(directory, 'pokemons.csv');

    await storage.save(
      [
        {
          name: 'Pikachu',
          description: 'Electric, "mouse"\nPokémon',
        },
      ],
      filePath,
    );

    const csv = await readFile(filePath, 'utf8');

    expect(csv).toContain('"Electric, ""mouse""\nPokémon"');
  });

  it('creates missing parent directories', async () => {
    const directory = await createTempDir();
    const filePath = join(directory, 'nested', 'output', 'pokemons.csv');

    await storage.save([{ name: 'Pikachu' }], filePath);

    const csv = await readFile(filePath, 'utf8');

    expect(csv).toContain('Pikachu');
  });

  it('saves null values as empty CSV cells', async () => {
    const directory = await createTempDir();
    const filePath = join(directory, 'pokemons.csv');

    await storage.save([{ name: 'Pikachu', price: null, stock: null }], filePath);

    const csv = await readFile(filePath, 'utf8');

    expect(csv.trim()).toBe('name,price,stock\nPikachu,,');
  });
});
