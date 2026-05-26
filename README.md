# Panganku Scraper

High-performance, resilient scraper for [panganku.org](https://panganku.org) (the official Indonesian food nutrition database), built with Node.js.

## Key Enhancements ✨

- **High-Performance Concurrency**: Upgraded from sequential fetching (which took several hours) to a robust, zero-dependency concurrent worker pool. Fetches the complete database of **1,146 items in less than 5 minutes**.
- **Resilient Session Checkpointing**: Automatically saves incremental progress in `panganku_progress.json`. If interrupted or crashed, it safely resumes exactly where it left off, avoiding redundant web requests.
- **Normalized Numeric Data**: Automatically cleans and parses raw textual nutritional strings (e.g. `"1,147.1 mg"`, `"11.6 g"`, `"513 Kal"`) into clean numerical floats/integers (e.g., `1147.1`, `11.6`, `513`). The output is immediately ready to load into a Pandas DataFrame (`panganku.ipynb`) for mathematical modeling, without tedious regex cleanup.
- **Exponential Backoff & Jitter**: Integrates smart error-recovery with automatic request retries and random delay jitter to be highly polite and prevent IP bans.
- **Elegant Terminal UI**: Visualizes real-time stats including completed counts, percentage success/fail rates, active items, and estimated time of arrival (ETA).

---

## Installation & Setup

1. Install dependencies (requires Node.js):
   ```bash
   npm install
   ```

2. Run the concurrent scraper:
   ```bash
   node panganku.js
   ```

3. If you have older scraped data containing raw units and strings in `data.json`, you can fully normalize them to numeric formats using the provided utility:
   ```bash
   node clean_existing_data.js
   ```

---

## Data Schema & Output

The output is stored as a JSON array of objects in `data.json`. 

- **Metadata fields** are kept as strings: `Kode`, `Nama`, `Nama Latin`, `Asal`, `Kelompok`, `Tipe`, `Deskripsi`, `jumlah`.
- **BDD** (Berat Dapat Dimakan / Edible Portion %) is represented as a clean integer (e.g. `89`).
- **Nutrient Compositions** (e.g. `Water`, `Energy`, `Protein`, `Fat`, `CHO`, `Fibre`, `Ca`, `Fe`, `K`, `Vit. C`, etc.) are parsed as numeric floats/integers, or `null` if the data is unavailable.

---

## Configuration

You can customize the following constants directly at the top of `panganku.js`:

```javascript
const CONCURRENCY_LIMIT = 5; // Adjust simultaneous request threads (default: 5)
const MAX_RETRIES = 3;       // Number of retries on request failure
```

---

## License

MIT
