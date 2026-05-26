const fs = require('fs');

/**
 * Utility to parse raw Indonesian nutritional strings to clean floats or integers.
 */
function parseNumericValue(valueStr) {
    if (valueStr === undefined || valueStr === null) return null;
    if (typeof valueStr === 'number') return valueStr;
    const cleanStr = valueStr.toString().trim();
    if (cleanStr === '' || cleanStr === '-') return null;
    
    const numMatch = cleanStr.match(/^-?[0-9,.]+/);
    if (!numMatch) return null;
    
    let numStr = numMatch[0];
    
    if (numStr.includes(',') && numStr.includes('.')) {
        numStr = numStr.replace(/,/g, '');
    } else if (numStr.includes(',')) {
        numStr = numStr.replace(/,/g, '');
    }
    
    const parsed = parseFloat(numStr);
    return isNaN(parsed) ? null : parsed;
}

const METADATA_KEYS = new Set([
    'Kode', 'Nama', 'Nama Latin', 'Asal', 'Kelompok', 
    'Kategori', 'Tipe', 'Tipe Bahan', 'Deskripsi', 'Keterangan', 'jumlah'
]);

function cleanDataFile() {
    try {
        console.log('Reading data.json...');
        const rawData = fs.readFileSync('data.json', 'utf8');
        const items = JSON.parse(rawData);
        
        let cleanedCount = 0;
        let fieldCount = 0;
        
        const cleanedItems = items.map(item => {
            if (!item || typeof item !== 'object') return item;
            
            const newItem = { ...item };
            
            // Clean BDD (ensure it is number)
            if (newItem.BDD !== undefined && newItem.BDD !== null) {
                const parsedBDD = parseInt(newItem.BDD.toString().replace(/[^0-9]/g, ''), 10);
                newItem.BDD = isNaN(parsedBDD) ? null : parsedBDD;
            }
            
            // Clean compositions
            Object.keys(newItem).forEach(key => {
                if (!METADATA_KEYS.has(key) && key !== 'BDD') {
                    const originalValue = newItem[key];
                    if (originalValue !== null && originalValue !== undefined) {
                        const parsedValue = parseNumericValue(originalValue);
                        if (parsedValue !== originalValue) {
                            newItem[key] = parsedValue;
                            fieldCount++;
                        }
                    }
                }
            });
            
            cleanedCount++;
            return newItem;
        });
        
        console.log(`Cleaned composition fields for all ${cleanedCount} records (modified ${fieldCount} values).`);
        
        fs.writeFileSync('data.json', JSON.stringify(cleanedItems, null, 2));
        console.log('Saved fully normalized clean data back to data.json!');
    } catch (e) {
        console.error('Failed to clean data.json:', e.message);
    }
}

cleanDataFile();
