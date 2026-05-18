const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'takeaway.db');
const db = new sqlite3.Database(dbPath);

const wb = xlsx.readFile('../solo items.xlsx');
const sheet = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});

let successCount = 0;

db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO inventory (name, purchase_unit, recipe_unit, conversion_rate, quantity, cost_per_purchase_unit) VALUES (?, ?, ?, ?, ?, ?)`);

    // Skip row 0 (headers)
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        const name = row[0];
        if (typeof name !== 'string' || name.trim() === '') continue;
        
        // Sometimes it's a section header like "المخزن" without quantities
        const quantity = parseFloat(row[1]);
        if (isNaN(quantity)) continue; // skip headers
        
        let unit = row[2] || 'وحدة';
        let totalCost = parseFloat(row[4]) || 0;
        let costPerUnit = quantity > 0 ? totalCost / quantity : 0;
        
        // Format names and units nicely
        const cleanName = name.trim();
        const cleanUnit = typeof unit === 'string' ? unit.trim() : 'وحدة';
        
        stmt.run([cleanName, cleanUnit, cleanUnit, 1, quantity, costPerUnit]);
        successCount++;
    }
    
    stmt.finalize();
    console.log(`Successfully imported ${successCount} items from solo items.xlsx`);
});

db.close();
