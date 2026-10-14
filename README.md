# Pokémon Parser

Збирає дані про Pokémon із каталогу [scrapeme.live/shop](https://scrapeme.live/shop/) та зберігає їх у CSV.

## Технології

- **Bun і TypeScript** — запуск застосунку та тестів.
- **ky** — HTTP-запити; **Cheerio** — розбір HTML.
- **csv-stringify** — формування CSV; **Vite+** — перевірка коду.

## Встановлення та запуск

```bash
bun install
bun run start
```

## Результат

Файл `output/pokemons.csv` містить поля `name`, `price`, `description`, `sku`, `stock` (назва, ціна, опис, артикул і залишок).

## Тестування

```bash
bun test
bun test --coverage
```
