const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'takeaway.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Create Shifts Table
    db.run(`
        CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            starting_cash REAL DEFAULT 0,
            ending_cash_expected REAL DEFAULT 0,
            ending_cash_actual REAL DEFAULT 0,
            status TEXT DEFAULT 'open',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error("Error creating shifts table:", err.message);
        else console.log("Shifts table created/verified.");
    });

    // 2. Add new columns to Sales table
    // SQLite doesn't support IF NOT EXISTS on ADD COLUMN easily, so we just catch the error if they exist.
    const columnsToAdd = [
        { name: 'shift_id', type: 'INTEGER' },
        { name: 'order_type', type: 'TEXT DEFAULT "takeaway"' },
        { name: 'discount', type: 'REAL DEFAULT 0' },
        { name: 'tax', type: 'REAL DEFAULT 0' },
        { name: 'net_total', type: 'REAL DEFAULT 0' }
    ];

    columnsToAdd.forEach(col => {
        db.run(`ALTER TABLE sales ADD COLUMN ${col.name} ${col.type}`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error(`Error adding column ${col.name}:`, err.message);
            } else {
                console.log(`Column ${col.name} added/verified.`);
            }
        });
    });

    // 3. Update database.js schema definitions directly via a multi_replace? No, I will just run this script to update the DB, 
    // and then manually update database.js so future setups match.
});

db.close(() => {
    console.log("Migration finished.");
});
