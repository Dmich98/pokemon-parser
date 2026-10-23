# Pokémon Parser

Збирає дані про Pokémon із каталогу [scrapeme.live/shop](https://scrapeme.live/shop/) та зберігає їх у CSV.

Також підтримує обхід Wikipedia за першими придатними посиланнями до заданої статті, зокрема Philosophy. Поточна точка входу запускає цей обхід і показує маршрут, час та причину завершення.

## Технології

- **Bun і TypeScript** — запуск застосунку та тестів.
- **ky** — HTTP-запити; **Cheerio** — розбір HTML.
- **csv-stringify** — формування CSV; **Vite+** — перевірка коду.
- **@clack/prompts** — оформлення CLI; декоратор **withSpinner** — індикатор виконання HTTP-запитів.

## Встановлення та запуск

```bash
bun install
bun run start
```

## Результат

Для сценарію Pokémon файл `output/pokemons.csv` містить поля `name`, `price`, `description`, `sku`, `stock` (назва, ціна, опис, артикул і залишок).

## Тестування

```bash
bun test
bun test --coverage
```
