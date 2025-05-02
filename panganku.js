const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function fetchCodes() {
    try {
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

        console.log('Total codes found:', codes.length);
        return codes
    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

async function fetchNutrisiData(code) {
    try {
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
                }
            }
        );

        const $ = cheerio.load(response.data);
        const table = $('table tbody');
        const result = {};

        // informasi detail pangan

        $('tr').each((_, tr) => {
            const key = $(tr).find('b').text().trim();
            const value = $(tr).find('td').last().text().trim();
            if (key) {
                result[key] = value;
            }
        });

        // jumlah & BDD
        const strongTags = $('strong').toArray();

        const jumlah = $(strongTags[0]).text().trim(); // e.g. "100 g"
        const bddText = $(strongTags[1]).text();       // e.g. "Berat Dapat Dimakan (BDD) 89 %"
        const bddMatch = bddText.match(/(\d+)\s*%/);

        result['jumlah'] = jumlah;
        result['BDD'] = bddMatch ? parseInt(bddMatch[1]) : null;

        // komposisi

        $('tr').each((_, tr) => {
            const key = $(tr).find('td').first().find('i').text().trim();
            const value = $(tr).find('td').last().text().replace(/\u00a0|:/g, '').trim();
            if (key && value) {
                result[key] = value;
            }
        });

        console.log(result)
        return result

    } catch (error) {
        console.error('Error fetching data:', error.message);
    }
}

async function main() {
    const codes = await fetchCodes();

    // const results = [];

    // for (const code of codes) {
    //     try {
    //         const data = await fetchNutrisiData(code);
    //         results.push(data);
    //         console.log(`Fetched: ${code}`);
    //     } catch (err) {
    //         console.warn(`Failed to fetch ${code}: ${err.message}`);
    //     }
    // }

    // fs.writeFileSync('nutrisi_data.json', JSON.stringify(results, null, 2));
    // console.log('All data saved to nutrisi_data.json');

}

main()

// async function main_test() {
//     const codes = await fetchCodes();
//     const results = [];

//     const jsonString = fs.readFileSync('nutrisi_data.json', 'utf8');
//     const jsonData = JSON.parse(jsonString);

//     const kodeList = jsonData
//         .filter(item => item !== null && item !== undefined && item.Kode !== undefined)
//         .map(item => item.Kode);

//     // Convert both arrays to Sets to easily find differences
//     const codesSet = new Set(codes);
//     const kodeListSet = new Set(kodeList);

//     // Find items in 'codes' that are not in 'kodeList'
//     const notInKodeList = [...codesSet].filter(code => !kodeListSet.has(code));

//     // Find items in 'kodeList' that are not in 'codes'
//     const notInCodes = [...kodeListSet].filter(code => !codesSet.has(code));

//     console.log("Items in 'codes' but not in 'kodeList':", notInKodeList);
//     console.log("Items in 'kodeList' but not in 'codes':", notInCodes);

// }

// main_test();