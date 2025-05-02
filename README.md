# panganku-scraper

Scraper for [panganku.org](https://panganku.org), an Indonesian food nutrition database, built with Node.js.

## Description

This script scrapes nutritional data of 1,146 food items from panganku.org and stores the result in `data.json`.

⚠️ It's very slow — scraping takes several hours due to the sequential request logic. The script currently doesn't use parallel or concurrent techniques, and there's no plan to improve it (because I'm lazy 😅).

## Usage

1. Install dependencies:

```bash
npm install
```

2. Run the scraper:

```bash
node panganku.js
```

3. Check the output:

Data will be saved in `data.json`.

## License

MIT (or add your preferred license here)
