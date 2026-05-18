const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const bcrypt = require('bcrypt');
const multer = require('multer');

// Use environment variables for data storage paths (for Fly.io persistent volumes)
const DATA_DIR = process.env.DATA_DIR || __dirname;

const uploadsDir = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Serve static React frontend files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ========================
// Upload Route
// ========================
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// ========================
// Auth Routes
// ========================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'User not found' });
        
        const valid = await bcrypt.compare(password, user.password);
        if (valid) {
            // In a real app, use JWT. For local app, simple user object is fine.
            const { password, ...userWithoutPassword } = user;
            res.json({ user: userWithoutPassword });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    });
});

app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, role, permissions FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', async (req, res) => {
    const { username, password, role, permissions } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)`, 
        [username, hashedPassword, role, JSON.stringify(permissions)], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
    });
});

app.put('/api/users/:id', async (req, res) => {
    const { username, password, role, permissions } = req.body;
    const { id } = req.params;
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`UPDATE users SET username = ?, password = ?, role = ?, permissions = ? WHERE id = ?`, 
            [username, hashedPassword, role, JSON.stringify(permissions), id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
        });
    } else {
        db.run(`UPDATE users SET username = ?, role = ?, permissions = ? WHERE id = ?`, 
            [username, role, JSON.stringify(permissions), id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
        });
    }
});

app.delete('/api/users/:id', (req, res) => {
    db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


// ========================
// Inventory Routes
// ========================
app.get('/api/inventory', (req, res) => {
    db.all(`SELECT * FROM inventory`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/inventory', (req, res) => {
    const { name, purchase_unit, recipe_unit, conversion_rate, quantity, low_stock_threshold, cost_per_purchase_unit, yield_percent } = req.body;
    db.run(`INSERT INTO inventory (name, purchase_unit, recipe_unit, conversion_rate, quantity, low_stock_threshold, cost_per_purchase_unit, yield_percent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, purchase_unit, recipe_unit, conversion_rate, quantity, low_stock_threshold, cost_per_purchase_unit, yield_percent], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.put('/api/inventory/:id', (req, res) => {
    const { name, purchase_unit, recipe_unit, conversion_rate, quantity, low_stock_threshold, cost_per_purchase_unit, yield_percent } = req.body;
    db.run(`UPDATE inventory SET name=?, purchase_unit=?, recipe_unit=?, conversion_rate=?, quantity=?, low_stock_threshold=?, cost_per_purchase_unit=?, yield_percent=?, last_updated=CURRENT_TIMESTAMP WHERE id=?`,
        [name, purchase_unit, recipe_unit, conversion_rate, quantity, low_stock_threshold, cost_per_purchase_unit, yield_percent, req.params.id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.delete('/api/inventory/:id', (req, res) => {
    db.run(`DELETE FROM inventory WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


// ========================
// Recipes Routes
// ========================
app.get('/api/recipes', (req, res) => {
    db.all(`SELECT * FROM recipes`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/recipes/:id/ingredients', (req, res) => {
    db.all(`SELECT ri.*, i.name, i.recipe_unit, i.cost_per_purchase_unit, i.conversion_rate, i.yield_percent
            FROM recipe_ingredients ri
            JOIN inventory i ON ri.inventory_id = i.id
            WHERE ri.recipe_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/recipes', (req, res) => {
    const { name, category, selling_price, instructions, image_url, ingredients } = req.body;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        db.run(`INSERT INTO recipes (name, category, selling_price, instructions, image_url) VALUES (?, ?, ?, ?, ?)`,
            [name, category, selling_price, instructions, image_url], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                const recipeId = this.lastID;
                if (ingredients && ingredients.length > 0) {
                    const stmt = db.prepare(`INSERT INTO recipe_ingredients (recipe_id, inventory_id, quantity_needed) VALUES (?, ?, ?)`);
                    ingredients.forEach(ing => {
                        stmt.run([recipeId, ing.inventory_id, ing.quantity_needed]);
                    });
                    stmt.finalize();
                }
                db.run('COMMIT');
                res.json({ id: recipeId });
            });
    });
});

app.delete('/api/recipes/:id', (req, res) => {
    db.run(`DELETE FROM recipes WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});


// ========================
// Sales Routes
// ========================
app.get('/api/sales', (req, res) => {
    db.all(`SELECT s.*, r.name as recipe_name FROM sales s JOIN recipes r ON s.recipe_id = r.id ORDER BY s.sale_date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sales', (req, res) => {
    const { items, user_id, shift_id, order_type, discount, tax, net_total } = req.body; 
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        let errorOccurred = false;
        let pendingOperations = items.length;
        
        if (pendingOperations === 0) {
            db.run('COMMIT');
            return res.json({ success: true });
        }

        const stmtSale = db.prepare(`INSERT INTO sales (recipe_id, quantity, total_price, user_id, shift_id, order_type, discount, tax, net_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        items.forEach(item => {
            stmtSale.run([item.recipe_id, item.quantity, item.total_price, user_id, shift_id, order_type, discount, tax, net_total], function(err) {
                if (err) errorOccurred = true;
                
                // Deduct from inventory
                db.all(`SELECT inventory_id, quantity_needed FROM recipe_ingredients WHERE recipe_id = ?`, [item.recipe_id], (err, ingredients) => {
                    if (err) errorOccurred = true;
                    
                    if (ingredients && ingredients.length > 0) {
                        const stmtUpdate = db.prepare(`UPDATE inventory SET quantity = quantity - ? WHERE id = ?`);
                        ingredients.forEach(ing => {
                            const totalNeeded = ing.quantity_needed * item.quantity;
                            stmtUpdate.run([totalNeeded, ing.inventory_id]);
                        });
                        stmtUpdate.finalize();
                    }
                    
                    pendingOperations--;
                    if (pendingOperations === 0) {
                        if (errorOccurred) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: 'Transaction failed' });
                        } else {
                            db.run('COMMIT');
                            res.json({ success: true });
                        }
                    }
                });
            });
        });
        stmtSale.finalize();
    });
});

// ========================
// Waste Routes
// ========================
app.get('/api/waste', (req, res) => {
    db.all(`SELECT w.*, i.name as inventory_name FROM waste w JOIN inventory i ON w.inventory_id = i.id ORDER BY w.waste_date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/waste', (req, res) => {
    const { inventory_id, quantity, waste_type, reason, user_id } = req.body;
    
    // First calculate cost based on current inventory cost
    db.get(`SELECT cost_per_purchase_unit, conversion_rate FROM inventory WHERE id = ?`, [inventory_id], (err, inv) => {
        if (err || !inv) return res.status(500).json({ error: 'Inventory not found' });
        
        const costPerRecipeUnit = inv.cost_per_purchase_unit / inv.conversion_rate;
        const totalCost = costPerRecipeUnit * quantity;
        
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            db.run(`INSERT INTO waste (inventory_id, quantity, waste_type, cost, reason, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
                [inventory_id, quantity, waste_type, totalCost, reason, user_id]);
                
            db.run(`UPDATE inventory SET quantity = quantity - ? WHERE id = ?`, [quantity, inventory_id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                db.run('COMMIT');
                res.json({ success: true });
            });
        });
    });
});

// ========================
// Purchases Routes
// ========================
app.get('/api/purchases', (req, res) => {
    db.all(`SELECT p.*, i.name as inventory_name FROM purchases p JOIN inventory i ON p.inventory_id = i.id ORDER BY p.purchase_date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/purchases', (req, res) => {
    const { inventory_id, quantity_purchased, cost_per_purchase_unit, user_id } = req.body;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(`INSERT INTO purchases (inventory_id, quantity_purchased, cost_per_purchase_unit, user_id) VALUES (?, ?, ?, ?)`,
            [inventory_id, quantity_purchased, cost_per_purchase_unit, user_id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err.message });
                }
                
                // Update inventory quantity and cost
                db.get(`SELECT conversion_rate FROM inventory WHERE id = ?`, [inventory_id], (err, inv) => {
                    if (err || !inv) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Inventory not found' });
                    }
                    
                    const quantityInRecipeUnits = quantity_purchased * inv.conversion_rate;
                    
                    db.run(`UPDATE inventory SET quantity = quantity + ?, cost_per_purchase_unit = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?`,
                        [quantityInRecipeUnits, cost_per_purchase_unit, inventory_id], function(err) {
                            if (err) {
                                db.run('ROLLBACK');
                                return res.status(500).json({ error: err.message });
                            }
                            
                            db.run('COMMIT');
                            res.json({ success: true });
                        });
                });
        });
    });
});

// ========================
// Dashboard Stats
// ========================
app.get('/api/stats', (req, res) => {
    const stats = {};
    db.serialize(() => {
        db.get(`SELECT SUM(total_price) as totalSales FROM sales WHERE date(sale_date) = date('now')`, (err, row) => {
            stats.salesToday = row ? row.totalSales : 0;
            
            db.get(`SELECT COUNT(*) as lowStock FROM inventory WHERE quantity <= low_stock_threshold`, (err, row) => {
                stats.lowStock = row ? row.lowStock : 0;
                
                db.get(`SELECT SUM(cost) as totalWaste FROM waste WHERE date(waste_date) = date('now')`, (err, row) => {
                    stats.wasteToday = row ? row.totalWaste : 0;
                    res.json(stats);
                });
            });
        });
    });
});

// ========================
// Shifts Routes
// ========================
app.get('/api/shifts/active/:userId', (req, res) => {
    db.get(`SELECT * FROM shifts WHERE user_id = ? AND status = 'open'`, [req.params.userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || null);
    });
});

app.post('/api/shifts/open', (req, res) => {
    const { user_id, starting_cash } = req.body;
    db.run(`INSERT INTO shifts (user_id, starting_cash) VALUES (?, ?)`, [user_id, starting_cash], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, user_id, starting_cash, status: 'open' });
    });
});

app.post('/api/shifts/close/:id', (req, res) => {
    const { ending_cash_actual } = req.body;
    db.get(`SELECT starting_cash FROM shifts WHERE id = ?`, [req.params.id], (err, shift) => {
        db.get(`SELECT SUM(net_total) as totalSales FROM sales WHERE shift_id = ?`, [req.params.id], (err, sales) => {
            const expected = (shift.starting_cash || 0) + (sales.totalSales || 0);
            db.run(`UPDATE shifts SET end_time = CURRENT_TIMESTAMP, ending_cash_expected = ?, ending_cash_actual = ?, status = 'closed' WHERE id = ?`,
                [expected, ending_cash_actual, req.params.id], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ success: true, expected });
            });
        });
    });
});

   // ========================
// Settings Routes
// ========================
const settingsPath = path.join(DATA_DIR, 'settings.json');

const getSettings = () => {
    if (fs.existsSync(settingsPath)) {
        return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
    return { currency: 'ريال', targetProfitMargin: 30 };
};

app.get('/api/settings', (req, res) => {
    res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
    const newSettings = { ...getSettings(), ...req.body };
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));
    res.json(newSettings);
});

// Fallback to index.html for React Router
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`To expose this server via ngrok, run: ngrok http ${PORT}`);
});
