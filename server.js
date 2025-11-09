const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const backup = require('./backup');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cache control for Replit iframe proxy
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static('public'));

// Initialize database
const db = new sqlite3.Database('./pos.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Items table
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    gst REAL NOT NULL,
    mrp REAL,
    discount REAL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating items table:', err.message);
    }
  });

  // Add mrp and discount columns to existing items table if they don't exist
  db.all("PRAGMA table_info(items)", [], (err, columns) => {
    if (err) {
      console.error('Error checking items table:', err.message);
      return;
    }
    const hasMrpColumn = columns.some(col => col.name === 'mrp');
    const hasDiscountColumn = columns.some(col => col.name === 'discount');
    
    if (!hasMrpColumn) {
      db.run('ALTER TABLE items ADD COLUMN mrp REAL DEFAULT NULL', (err) => {
        if (err) {
          console.error('Error adding mrp to items:', err.message);
        } else {
          console.log('Added mrp column to items table');
          // Migrate existing items: set mrp = price
          db.run('UPDATE items SET mrp = price WHERE mrp IS NULL', (err) => {
            if (err) console.error('Error migrating mrp:', err.message);
          });
        }
      });
    }
    
    if (!hasDiscountColumn) {
      db.run('ALTER TABLE items ADD COLUMN discount REAL DEFAULT NULL', (err) => {
        if (err) {
          console.error('Error adding discount to items:', err.message);
        } else {
          console.log('Added discount column to items table');
        }
      });
    }
  });

  // Invoices table
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_mobile TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    cgst REAL NOT NULL,
    sgst REAL NOT NULL,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating invoices table:', err.message);
    }
  });

  // Quotations table
  db.run(`CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_mobile TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    cgst REAL NOT NULL,
    sgst REAL NOT NULL,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating quotations table:', err.message);
    }
  });

  // Add customer_gst column to invoices if it doesn't exist
  db.all("PRAGMA table_info(invoices)", [], (err, columns) => {
    if (err) {
      console.error('Error checking invoices table:', err.message);
      return;
    }
    const hasGstColumn = columns.some(col => col.name === 'customer_gst');
    const hasAddressColumn = columns.some(col => col.name === 'customer_address');
    
    if (!hasGstColumn) {
      db.run('ALTER TABLE invoices ADD COLUMN customer_gst TEXT DEFAULT NULL', (err) => {
        if (err) {
          console.error('Error adding customer_gst to invoices:', err.message);
        } else {
          console.log('Added customer_gst column to invoices table');
        }
      });
    }
    
    if (!hasAddressColumn) {
      db.run('ALTER TABLE invoices ADD COLUMN customer_address TEXT DEFAULT NULL', (err) => {
        if (err) {
          console.error('Error adding customer_address to invoices:', err.message);
        } else {
          console.log('Added customer_address column to invoices table');
        }
      });
    }
  });

  // Add customer_gst column to quotations if it doesn't exist
  db.all("PRAGMA table_info(quotations)", [], (err, columns) => {
    if (err) {
      console.error('Error checking quotations table:', err.message);
      return;
    }
    const hasGstColumn = columns.some(col => col.name === 'customer_gst');
    if (!hasGstColumn) {
      db.run('ALTER TABLE quotations ADD COLUMN customer_gst TEXT DEFAULT NULL', (err) => {
        if (err) {
          console.error('Error adding customer_gst to quotations:', err.message);
        } else {
          console.log('Added customer_gst column to quotations table');
        }
      });
    }
  });

  // Add customer_address column to quotations if it doesn't exist
  db.all("PRAGMA table_info(quotations)", [], (err, columns) => {
    if (err) {
      console.error('Error checking quotations table:', err.message);
      return;
    }
    const hasAddressColumn = columns.some(col => col.name === 'customer_address');
    if (!hasAddressColumn) {
      db.run('ALTER TABLE quotations ADD COLUMN customer_address TEXT DEFAULT NULL', (err) => {
        if (err) {
          console.error('Error adding customer_address to quotations:', err.message);
        } else {
          console.log('Added customer_address column to quotations table');
        }
      });
    }
  });
}

// Helper function to normalize mobile numbers
function normalizeMobile(mobile) {
  if (!mobile) return '';
  const digitsOnly = mobile.replace(/\D/g, '');
  if (digitsOnly.startsWith('91') && digitsOnly.length === 12) {
    return digitsOnly.substring(2);
  }
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  return digitsOnly.slice(-10);
}

// API Routes

// Search customer by mobile number
app.get('/api/customers/search', (req, res) => {
  const mobile = req.query.mobile;
  
  if (!mobile) {
    res.status(400).json({ error: 'Mobile number is required' });
    return;
  }

  const normalizedMobile = normalizeMobile(mobile);
  
  // Require at least 6 digits to avoid spurious matches
  if (!normalizedMobile || normalizedMobile.length < 6) {
    res.json({ found: false });
    return;
  }
  
  db.all(`
    SELECT customer_name, customer_mobile, customer_gst, customer_address, created_at, 'invoice' as source
    FROM invoices
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_mobile, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
    UNION
    SELECT customer_name, customer_mobile, customer_gst, customer_address, created_at, 'quotation' as source
    FROM quotations
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_mobile, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
    ORDER BY created_at DESC
    LIMIT 1
  `, [`%${normalizedMobile}%`, `%${normalizedMobile}%`], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows.length === 0) {
      res.json({ found: false });
    } else {
      const customer = rows[0];
      res.json({
        found: true,
        customer_name: customer.customer_name,
        customer_gst: customer.customer_gst,
        customer_address: customer.customer_address
      });
    }
  });
});

// Get all items
app.get('/api/items', (req, res) => {
  const search = req.query.search || '';
  let query = 'SELECT * FROM items';
  let params = [];

  if (search) {
    query += ' WHERE name LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY id ASC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add item
app.post('/api/items', (req, res) => {
  const { name, gst, mrp, discount } = req.body;

  if (!name || gst === undefined || mrp === undefined) {
    res.status(400).json({ error: 'Name, GST, and MRP are required' });
    return;
  }

  // Check for duplicate item name (case-insensitive)
  db.get('SELECT id FROM items WHERE LOWER(name) = LOWER(?)', [name], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(400).json({ error: 'Item with this name already exists in database' });
      return;
    }

    // Calculate price from MRP and discount
    const discountPercent = discount ? parseFloat(discount) : 0;
    const price = parseFloat(mrp) * (1 - discountPercent / 100);

    db.run(
      'INSERT INTO items (name, gst, mrp, discount, price) VALUES (?, ?, ?, ?, ?)',
      [name, parseFloat(gst), parseFloat(mrp), discountPercent || null, price],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, name, gst, mrp, discount: discountPercent || null, price });
      }
    );
  });
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const { name, gst, mrp, discount } = req.body;

  if (!name || gst === undefined || mrp === undefined) {
    res.status(400).json({ error: 'Name, GST, and MRP are required' });
    return;
  }

  // Check for duplicate item name (excluding current item, case-insensitive)
  db.get('SELECT id FROM items WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (row) {
      res.status(400).json({ error: 'Item with this name already exists in database' });
      return;
    }

    // Calculate price from MRP and discount
    const discountPercent = discount ? parseFloat(discount) : 0;
    const price = parseFloat(mrp) * (1 - discountPercent / 100);

    db.run(
      'UPDATE items SET name = ?, gst = ?, mrp = ?, discount = ?, price = ? WHERE id = ?',
      [name, parseFloat(gst), parseFloat(mrp), discountPercent || null, price, id],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: 'Item not found' });
          return;
        }
        res.json({ id, name, gst, mrp, discount: discountPercent || null, price, message: 'Item updated successfully' });
      }
    );
  });
});

// Remove item
app.delete('/api/items/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json({ message: 'Item deleted successfully' });
  });
});

// Create invoice
app.post('/api/invoices', (req, res) => {
  const { customer_name, customer_mobile, customer_gst, customer_address, items, subtotal, cgst, sgst, discount, total } = req.body;

  if (!customer_name || !customer_mobile) {
    res.status(400).json({ error: 'Customer name and mobile number are required' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Items are required' });
    return;
  }

  // Check for duplicate customer mobile number
  const normalizedMobile = normalizeMobile(customer_mobile);
  db.get(`
    SELECT customer_name, customer_mobile FROM invoices 
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_mobile, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
    UNION
    SELECT customer_name, customer_mobile FROM quotations
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_mobile, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
    LIMIT 1
  `, [`%${normalizedMobile}%`, `%${normalizedMobile}%`], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Allow if customer already exists with same name, or if it's a new customer
    if (row && row.customer_name.toLowerCase() !== customer_name.toLowerCase()) {
      res.status(400).json({ error: `Mobile number already exists for customer: ${row.customer_name}` });
      return;
    }

    const itemsJson = JSON.stringify(items);

    db.run(
      'INSERT INTO invoices (customer_name, customer_mobile, customer_gst, customer_address, items, subtotal, cgst, sgst, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_name || '', customer_mobile || '', customer_gst || null, customer_address || null, itemsJson, parseFloat(subtotal), parseFloat(cgst), parseFloat(sgst), parseFloat(discount || 0), parseFloat(total)],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, message: 'Invoice created successfully' });
      }
    );
  });
});

// Get all invoices
app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse items JSON for each invoice
    rows.forEach(row => {
      row.items = JSON.parse(row.items);
    });
    res.json(rows);
  });
});

// Get invoice by ID
app.get('/api/invoices/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM invoices WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    row.items = JSON.parse(row.items);
    res.json(row);
  });
});

// Quotation API Routes

// Get all quotations
app.get('/api/quotations', (req, res) => {
  db.all('SELECT * FROM quotations ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse items JSON for each quotation
    rows.forEach(row => {
      row.items = JSON.parse(row.items);
    });
    res.json(rows);
  });
});

// Get quotation by ID
app.get('/api/quotations/:id', (req, res) => {
  const id = req.params.id;

  db.get('SELECT * FROM quotations WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }
    row.items = JSON.parse(row.items);
    res.json(row);
  });
});

// Create quotation
app.post('/api/quotations', (req, res) => {
  const { customer_name, customer_mobile, customer_gst, customer_address, items, subtotal, cgst, sgst, discount, total } = req.body;

  if (!customer_name || !customer_mobile) {
    res.status(400).json({ error: 'Customer name and mobile number are required' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Items are required' });
    return;
  }

  // Check for duplicate customer mobile number
  const normalizedMobile = normalizeMobile(customer_mobile);
  db.get(`
    SELECT customer_name, customer_mobile FROM invoices 
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_mobile, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
    UNION
    SELECT customer_name, customer_mobile FROM quotations
    WHERE REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(customer_mobile, ' ', ''), '-', ''), '+', ''), '(', ''), ')', '') LIKE ?
    LIMIT 1
  `, [`%${normalizedMobile}%`, `%${normalizedMobile}%`], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Allow if customer already exists with same name, or if it's a new customer
    if (row && row.customer_name.toLowerCase() !== customer_name.toLowerCase()) {
      res.status(400).json({ error: `Mobile number already exists for customer: ${row.customer_name}` });
      return;
    }

    const itemsJson = JSON.stringify(items);

    db.run(
      'INSERT INTO quotations (customer_name, customer_mobile, customer_gst, customer_address, items, subtotal, cgst, sgst, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_name, customer_mobile, customer_gst || null, customer_address || null, itemsJson, parseFloat(subtotal), parseFloat(cgst), parseFloat(sgst), parseFloat(discount || 0), parseFloat(total)],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ id: this.lastID, message: 'Quotation created successfully' });
      }
    );
  });
});

// Convert quotation to invoice (quotation is kept by default)
app.post('/api/quotations/:id/convert', (req, res) => {
  const id = req.params.id;

  // Get quotation
  db.get('SELECT * FROM quotations WHERE id = ?', [id], (err, quotation) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!quotation) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    // Create invoice from quotation (quotation remains in database)
    db.run(
      'INSERT INTO invoices (customer_name, customer_mobile, customer_gst, customer_address, items, subtotal, cgst, sgst, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [quotation.customer_name, quotation.customer_mobile, quotation.customer_gst, quotation.customer_address, quotation.items, quotation.subtotal, quotation.cgst, quotation.sgst, quotation.discount, quotation.total],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        res.json({ id: this.lastID, message: 'Quotation converted to invoice successfully. Quotation entry preserved.' });
      }
    );
  });
});

// Delete quotation
app.delete('/api/quotations/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM quotations WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }
    res.json({ message: 'Quotation deleted successfully' });
  });
});

// Dashboard API Routes

// Get monthly total (current month)
app.get('/api/dashboard/monthly-total', (req, res) => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  db.get(
    `SELECT COALESCE(SUM(total), 0) as total 
     FROM invoices 
     WHERE strftime('%m', created_at) = ? AND strftime('%Y', created_at) = ?`,
    [String(currentMonth).padStart(2, '0'), String(currentYear)],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ total: row.total || 0 });
    }
  );
});

// Get monthly sales (last N months)
app.get('/api/dashboard/monthly-sales', (req, res) => {
  const months = parseInt(req.query.months) || 12;
  
  db.all(
    `SELECT 
      substr(created_at, 1, 7) as month,
      COALESCE(SUM(total), 0) as total
     FROM invoices
     WHERE datetime(substr(created_at, 1, 19)) >= datetime('now', '-' || ? || ' months')
     GROUP BY substr(created_at, 1, 7)
     ORDER BY month ASC`,
    [months],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      // Format month labels in JavaScript
      const result = rows.map(row => {
        const [year, month] = row.month.split('-');
        const date = new Date(year, parseInt(month) - 1);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
          month: monthLabel,
          total: row.total
        };
      });
      res.json(result);
    }
  );
});

// Get yearly sales (last N years)
app.get('/api/dashboard/yearly-sales', (req, res) => {
  const years = parseInt(req.query.years) || 5;
  
  db.all(
    `SELECT 
      strftime('%Y', created_at) as year,
      COALESCE(SUM(total), 0) as total
     FROM invoices
     WHERE created_at >= datetime('now', '-' || ? || ' years')
     GROUP BY strftime('%Y', created_at)
     ORDER BY year ASC`,
    [years],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const result = rows.map(row => ({
        year: row.year,
        total: row.total
      }));
      res.json(result);
    }
  );
});

// Get monthly sales report (current month detailed breakdown)
app.get('/api/dashboard/monthly-report', (req, res) => {
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = String(now.getFullYear());
  
  db.all(
    `SELECT * FROM invoices 
     WHERE strftime('%m', created_at) = ? AND strftime('%Y', created_at) = ?
     ORDER BY created_at DESC`,
    [currentMonth, currentYear],
    (err, invoices) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      let totalSales = 0;
      let totalCGST = 0;
      let totalSGST = 0;
      let totalDiscount = 0;
      
      const reportData = invoices.map(invoice => {
        totalSales += parseFloat(invoice.total || 0);
        totalCGST += parseFloat(invoice.cgst || 0);
        totalSGST += parseFloat(invoice.sgst || 0);
        totalDiscount += parseFloat(invoice.discount || 0);
        
        return {
          invoiceId: invoice.id,
          date: new Date(invoice.created_at).toLocaleDateString('en-IN'),
          customerName: invoice.customer_name,
          customerMobile: invoice.customer_mobile,
          subtotal: parseFloat(invoice.subtotal || 0),
          cgst: parseFloat(invoice.cgst || 0),
          sgst: parseFloat(invoice.sgst || 0),
          discount: parseFloat(invoice.discount || 0),
          total: parseFloat(invoice.total || 0)
        };
      });
      
      res.json({
        month: `${now.toLocaleDateString('en-US', { month: 'long' })} ${currentYear}`,
        invoices: reportData,
        summary: {
          totalInvoices: invoices.length,
          totalSales: totalSales.toFixed(2),
          totalCGST: totalCGST.toFixed(2),
          totalSGST: totalSGST.toFixed(2),
          totalGST: (totalCGST + totalSGST).toFixed(2),
          totalDiscount: totalDiscount.toFixed(2)
        }
      });
    }
  );
});

// Get top 5 most sold items
app.get('/api/dashboard/top-items', (req, res) => {
  db.all('SELECT * FROM invoices', [], (err, invoices) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // Aggregate items from all invoices
    const itemStats = {};

    invoices.forEach(invoice => {
      try {
        const items = JSON.parse(invoice.items);
        items.forEach(item => {
          if (itemStats[item.name]) {
            itemStats[item.name].totalQuantity += item.quantity;
            itemStats[item.name].totalRevenue += item.price * item.quantity;
          } else {
            itemStats[item.name] = {
              name: item.name,
              totalQuantity: item.quantity,
              totalRevenue: item.price * item.quantity
            };
          }
        });
      } catch (e) {
        console.error('Error parsing invoice items:', e);
      }
    });

    // Convert to array and sort by quantity
    const topItems = Object.values(itemStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    res.json(topItems);
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/welcome', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'welcome.html'));
});

// Legacy route redirect
app.get('/demo', (req, res) => {
  res.redirect('/welcome');
});

app.get('/billing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'billing.html'));
});

app.get('/invoices', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invoices.html'));
});

app.get('/quotations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quotations.html'));
});

app.get('/quotations-list', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'quotations-list.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Backup API Routes
app.post('/api/backup/manual', async (req, res) => {
  try {
    const result = await backup.backupToFirebase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/backup/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    const result = await backup.restoreFromFirebase(filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backup/list', async (req, res) => {
  try {
    const backups = await backup.listBackups();
    res.json(backups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/backup/status', (req, res) => {
  const latestBackup = backup.getLatestBackupInfo();
  res.json({ 
    configured: true,
    type: 'local',
    message: 'Local backup system ready',
    latestBackup
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Local backup system ready');
  console.log('Backups will be saved to ./backups/ folder');
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});

