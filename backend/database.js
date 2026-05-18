const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'takeaway.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT,
            permissions TEXT
        )`, (err) => {
            if (!err) {
                // Insert default admin if no users exist
                db.get(`SELECT COUNT(*) as count FROM users`, async (err, row) => {
                    if (row.count === 0) {
                        const hashedPassword = await bcrypt.hash('taaheel2023', 10);
                        db.run(`INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)`, 
                            ['admin', hashedPassword, 'admin', JSON.stringify(['all'])]);
                        console.log('Default admin created: admin / taaheel2023');
                    }
                });
            }
        });

        // Shifts Table (إدارة الورديات)
        db.run(`CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            starting_cash REAL DEFAULT 0,
            ending_cash_expected REAL DEFAULT 0,
            ending_cash_actual REAL DEFAULT 0,
            status TEXT DEFAULT 'open',
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // Inventory Table (المخزون)
        db.run(`CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            purchase_unit TEXT NOT NULL,
            recipe_unit TEXT NOT NULL,
            conversion_rate REAL NOT NULL, -- e.g. 1 kg = 1000 g
            quantity REAL DEFAULT 0, -- In recipe_units (e.g. grams)
            low_stock_threshold REAL DEFAULT 0, -- الحد الخطر لنقص المخزون
            cost_per_purchase_unit REAL DEFAULT 0,
            yield_percent REAL DEFAULT 100, -- نسبة التصافي بعد التحضير
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Recipes Table (الوصفات)
        db.run(`CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            selling_price REAL NOT NULL,
            instructions TEXT, -- مستند حسب الرغبة مع الرسبي
            image_url TEXT, -- مسار الصورة المرفوعة
            estimated_cost REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Recipe Ingredients (مكونات الوصفة)
        db.run(`CREATE TABLE IF NOT EXISTS recipe_ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            inventory_id INTEGER,
            quantity_needed REAL NOT NULL, -- In recipe_unit (e.g. grams)
            FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE,
            FOREIGN KEY (inventory_id) REFERENCES inventory (id)
        )`);

        // Sales Table (المبيعات)
        db.run(`CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER,
            quantity INTEGER NOT NULL,
            total_price REAL NOT NULL,
            sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            shift_id INTEGER,
            order_type TEXT DEFAULT 'takeaway',
            discount REAL DEFAULT 0,
            tax REAL DEFAULT 0,
            net_total REAL DEFAULT 0,
            FOREIGN KEY (recipe_id) REFERENCES recipes (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (shift_id) REFERENCES shifts (id)
        )`);

        // Waste Table (الهالك)
        db.run(`CREATE TABLE IF NOT EXISTS waste (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventory_id INTEGER,
            quantity REAL NOT NULL, -- In recipe_unit
            waste_type TEXT, -- e.g. preparation, cooking, expiration
            cost REAL NOT NULL,
            reason TEXT,
            waste_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            FOREIGN KEY (inventory_id) REFERENCES inventory (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
        
        // Purchase History Table (حركة المشتريات لتحديث الأسعار)
        db.run(`CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventory_id INTEGER,
            quantity_purchased REAL NOT NULL, -- In purchase_unit
            cost_per_purchase_unit REAL NOT NULL,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,
            FOREIGN KEY (inventory_id) REFERENCES inventory (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
        
        console.log('Tables initialized successfully.');
    });
}

module.exports = db;
