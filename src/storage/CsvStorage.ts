import { stringify } from 'csv-stringify/sync';

export class CsvStorage {
  async save<T extends object>(data: readonly T[], filePath: string): Promise<void> {
    const csv = stringify([...data], {
      header: true,
    });

    await Bun.write(filePath, csv);

    console.log(`Data saved to ${filePath}`);
  }
}
