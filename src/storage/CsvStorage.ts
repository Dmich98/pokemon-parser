import { stringify } from 'csv-stringify/sync';

export class CsvStorage {
  constructor(private readonly filePath: string) {}

  async save<T extends object>(data: readonly T[]): Promise<void> {
    const csv = stringify([...data], {
      header: true,
    });

    await Bun.write(this.filePath, csv);

    console.log(`Data saved to ${this.filePath}`);
  }
}
