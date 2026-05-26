const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// Configurable constants
const CONCURRENCY_LIMIT = 5; // Safe concurrency to avoid rate limits/IP bans
const MAX_RETRIES = 3;       // Number of times to retry failed requests
const PROGRESS_FILE = 'panganku_progress.json';
const OUTPUT_FILE = 'data.json';

// In-memory results accumulator for signal handlers
let results = [];

/**
 * Utility to parse raw Indonesian nutritional strings to clean floats or integers.
 * E.g., "11.6 g" -> 11.6, "1,147.1 mg" -> 1147.1, "-" -> null
 */
function parseNumericValue(valueStr) {
    if (valueStr === undefined || valueStr === null) return null;
    if (typeof valueStr === 'number') return valueStr;
    const cleanStr = valueStr.toString().trim();
    if (cleanStr === '' || cleanStr === '-') return null;
    
    // Match optional negative sign and first sequence of digits/dots/commas
    const numMatch = cleanStr.match(/^-?[0-9,.]+/);
    if (!numMatch) return null;
    
    let numStr = numMatch[0];
    
    // Strip thousands separator commas (e.g. 1,147.1 -> 1147.1)
    if (numStr.includes(',') && numStr.includes('.')) {
        numStr = numStr.replace(/,/g, '');
    } else if (numStr.includes(',')) {
        numStr = numStr.replace(/,/g, '');
    }
    
    const parsed = parseFloat(numStr);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Fetches all valid food codes from the list index page.
 */
async function fetchCodes() {
    try {
        console.log('Fetching food index and codes from panganku.org...');
        const response = await axios.get("https://www.panganku.org/id-ID/semua_nutrisi", {
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "priority": "u=0, i",
                "Referer": "https://www.panganku.org/id-ID/view",
                "Referrer-Policy": "strict-origin-when-cross-origin"
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const codes = [];

        $('table tbody tr').each((i, el) => {
            const tds = $(el).find('td');
            if (tds.length >= 2) {
                const code = $(tds[1]).text().trim();
                if (code.match(/^[A-Z]{2}\d{3}$/)) {
                    codes.push(code);
                }
            }
        });

        console.log(`Total codes found: ${codes.length}`);
        return codes;
    } catch (error) {
        console.error('Error fetching index codes:', error.message);
        throw error;
    }
}

/**
 * Fetches and parses nutritional data for a specific code.
 */
async function fetchNutrisiData(code) {
    const response = await axios.post(
        'https://www.panganku.org/id-ID/view',
        new URLSearchParams({ haha: code }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Origin': 'https://www.panganku.org',
                'Referer': 'https://www.panganku.org/id-ID/semua_nutrisi',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
            },
            timeout: 10000 // 10 second timeout per request
        }
    );

    const $ = cheerio.load(response.data);
    const result = {};

    // 1. Informasi detail pangan (metadata keys like Kode, Nama, Kelompok, Tipe, etc.)
    $('tr').each((_, tr) => {
        const key = $(tr).find('b').text().trim();
        const value = $(tr).find('td').last().text().trim();
        if (key) {
            result[key] = value;
        }
    });

    // 2. Jumlah & BDD (Edible portion percentage)
    const strongTags = $('strong').toArray();
    if (strongTags.length >= 2) {
        const jumlah = $(strongTags[0]).text().trim(); // e.g. "100 g"
        const bddText = $(strongTags[1]).text();       // e.g. "Berat Dapat Dimakan (BDD) 89 %"
        const bddMatch = bddText.match(/(\d+)\s*%/);

        result['jumlah'] = jumlah;
        result['BDD'] = bddMatch ? parseInt(bddMatch[1], 10) : null;
    } else {
        result['jumlah'] = null;
        result['BDD'] = null;
    }

    // 3. Komposisi (Nutrients table - parsed to floats/integers)
    $('tr').each((_, tr) => {
        const key = $(tr).find('td').first().find('i').text().trim();
        const value = $(tr).find('td').last().text().replace(/\u00a0|:/g, '').trim();
        if (key && value) {
            result[key] = parseNumericValue(value);
        }
    });

    return result;
}

/**
 * Clean & resilient concurrent worker pool execution.
 */
async function asyncPool(concurrency, items, fn) {
    const resultsList = [];
    const executing = new Set();
    
    for (const item of items) {
        const p = Promise.resolve().then(() => fn(item));
        resultsList.push(p);
        executing.add(p);
        
        const clean = () => executing.delete(p);
        p.then(clean, clean);
        
        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }
    return Promise.all(resultsList);
}

/**
 * Handle graceful SIGINT (Ctrl+C) to prevent progress loss
 */
process.on('SIGINT', () => {
    console.log('\n\n[Abort Signal] Gracefully shutting down... Saving current progress.');
    if (results.length > 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results, null, 2));
        console.log(`Saved ${results.length} items to ${PROGRESS_FILE}. Run the scraper again to resume!`);
    }
    process.exit(0);
});

async function main() {
    let codes = [];
    try {
        codes = await fetchCodes();
    } catch (err) {
        console.error('Failed to initialise codes list. Exiting.');
        process.exit(1);
    }

    // Load progress cache if available
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            const cachedContent = fs.readFileSync(PROGRESS_FILE, 'utf8');
            results = JSON.parse(cachedContent);
            console.log(`Resuming session: loaded ${results.length} already scraped items.`);
        } catch (e) {
            console.warn(`Progress cache file is corrupted. Starting fresh.`);
            results = [];
        }
    } else {
        results = [];
    }

    const scrapedCodes = new Set(results.filter(r => r && r.Kode).map(r => r.Kode));
    const codesToScrape = codes.filter(code => !scrapedCodes.has(code));

    if (codesToScrape.length === 0) {
        console.log('All codes are already scraped! Writing final output file.');
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log(`Successfully output ${results.length} rows of clean data to ${OUTPUT_FILE}`);
        if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
        return;
    }

    console.log(`Starting scraper: ${codesToScrape.length} items remaining to fetch.`);
    
    let completed = results.length;
    const total = codes.length;
    let successCount = results.length;
    let failCount = 0;
    const startTime = Date.now();

    // Helper function to update beautiful console interface
    function updateConsoleProgress(currentCode, success) {
        completed++;
        if (success) successCount++;
        else failCount++;

        const elapsedMs = Date.now() - startTime;
        // Calculate items processed during *this run session* to keep average time per item accurate
        const processedThisSession = completed - results.length + failCount;
        const avgTimePerItem = processedThisSession > 0 ? elapsedMs / processedThisSession : 0;
        const remainingItems = total - completed;
        const etaMs = remainingItems * avgTimePerItem;

        const percent = ((completed / total) * 100).toFixed(1);
        const etaSec = Math.round(etaMs / 1000);
        const etaStr = etaSec > 60
            ? `${Math.floor(etaSec / 60)}m ${etaSec % 60}s`
            : `${etaSec}s`;

        process.stdout.write(
            `\r[Progress: ${completed}/${total} (${percent}%)] | Success: ${successCount} | Failed: ${failCount} | ETA: ${etaStr} | Processing: ${currentCode}...       `
        );
    }

    // Worker function for individual item fetching
    async function worker(code) {
        let attempt = 0;
        while (attempt < MAX_RETRIES) {
            try {
                // Polite random delay (100ms to 400ms) to avoid request overlapping spikes
                const jitter = Math.floor(Math.random() * 300) + 100;
                await new Promise(resolve => setTimeout(resolve, jitter));

                const itemData = await fetchNutrisiData(code);
                if (itemData && itemData.Kode) {
                    results.push(itemData);
                    // Write to progress file incrementally to survive crashes
                    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results, null, 2));
                    updateConsoleProgress(code, true);
                    return;
                }
                throw new Error('Invalid empty dataset returned');
            } catch (err) {
                attempt++;
                if (attempt >= MAX_RETRIES) {
                    failCount++;
                    console.error(`\n[Failed] Code ${code} permanently failed after ${MAX_RETRIES} attempts. Error: ${err.message}`);
                    updateConsoleProgress(code, false);
                    return;
                }
                // Exponential backoff with jitter
                const backoffTime = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 500);
                await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
        }
    }

    // Execute concurrently using our lightweight zero-dependency worker pool
    await asyncPool(CONCURRENCY_LIMIT, codesToScrape, worker);

    console.log('\n\n--- Scraping Finished! ---');
    console.log(`Total successfully processed: ${successCount}`);
    console.log(`Failed/Skipped: ${failCount}`);

    // Output final results
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
    console.log(`Clean normalized database successfully saved to: ${OUTPUT_FILE}`);

    // Clean up temporary progress cache
    if (fs.existsSync(PROGRESS_FILE)) {
        try {
            fs.unlinkSync(PROGRESS_FILE);
            console.log('Temporary cache file cleaned up.');
        } catch (e) {
            // Ignore error
        }
    }
}

main();