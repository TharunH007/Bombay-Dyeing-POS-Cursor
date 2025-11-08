const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating items table:', err.message);
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
}

// API Routes

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
  const { name, gst, price } = req.body;

  if (!name || gst === undefined || price === undefined) {
    res.status(400).json({ error: 'Name, GST, and Price are required' });
    return;
  }

  db.run(
    'INSERT INTO items (name, gst, price) VALUES (?, ?, ?)',
    [name, parseFloat(gst), parseFloat(price)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, gst, price });
    }
  );
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const id = req.params.id;
  const { name, gst, price } = req.body;

  if (!name || gst === undefined || price === undefined) {
    res.status(400).json({ error: 'Name, GST, and Price are required' });
    return;
  }

  db.run(
    'UPDATE items SET name = ?, gst = ?, price = ? WHERE id = ?',
    [name, parseFloat(gst), parseFloat(price), id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Item not found' });
        return;
      }
      res.json({ id, name, gst, price, message: 'Item updated successfully' });
    }
  );
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
  const { customer_name, customer_mobile, items, subtotal, cgst, sgst, discount, total } = req.body;

  if (!customer_name || !customer_mobile) {
    res.status(400).json({ error: 'Customer name and mobile number are required' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Items are required' });
    return;
  }

  const itemsJson = JSON.stringify(items);

  db.run(
    'INSERT INTO invoices (customer_name, customer_mobile, items, subtotal, cgst, sgst, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [customer_name || '', customer_mobile || '', itemsJson, parseFloat(subtotal), parseFloat(cgst), parseFloat(sgst), parseFloat(discount || 0), parseFloat(total)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Invoice created successfully' });
    }
  );
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
  const { customer_name, customer_mobile, items, subtotal, cgst, sgst, discount, total } = req.body;

  if (!customer_name || !customer_mobile) {
    res.status(400).json({ error: 'Customer name and mobile number are required' });
    return;
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Items are required' });
    return;
  }

  const itemsJson = JSON.stringify(items);

  db.run(
    'INSERT INTO quotations (customer_name, customer_mobile, items, subtotal, cgst, sgst, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [customer_name, customer_mobile, itemsJson, parseFloat(subtotal), parseFloat(cgst), parseFloat(sgst), parseFloat(discount || 0), parseFloat(total)],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Quotation created successfully' });
    }
  );
});

// Convert quotation to invoice
app.post('/api/quotations/:id/convert', (req, res) => {
  const id = req.params.id;
  const { deleteQuotation } = req.body;

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

    // Create invoice from quotation
    db.run(
      'INSERT INTO invoices (customer_name, customer_mobile, items, subtotal, cgst, sgst, discount, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [quotation.customer_name, quotation.customer_mobile, quotation.items, quotation.subtotal, quotation.cgst, quotation.sgst, quotation.discount, quotation.total],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Optionally delete quotation
        if (deleteQuotation) {
          db.run('DELETE FROM quotations WHERE id = ?', [id], (err) => {
            if (err) {
              console.error('Error deleting quotation:', err.message);
            }
          });
        }

        res.json({ id: this.lastID, message: 'Quotation converted to invoice successfully' });
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

// Get monthly sales (last 12 months)
app.get('/api/dashboard/monthly-sales', (req, res) => {
  db.all(
    `SELECT 
      strftime('%Y-%m', created_at) as month,
      strftime('%b %Y', created_at) as monthLabel,
      COALESCE(SUM(total), 0) as total
     FROM invoices
     WHERE created_at >= datetime('now', '-12 months')
     GROUP BY strftime('%Y-%m', created_at)
     ORDER BY month ASC`,
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const result = rows.map(row => ({
        month: row.monthLabel,
        total: row.total
      }));
      res.json(result);
    }
  );
});

// Get yearly sales
app.get('/api/dashboard/yearly-sales', (req, res) => {
  db.all(
    `SELECT 
      strftime('%Y', created_at) as year,
      COALESCE(SUM(total), 0) as total
     FROM invoices
     GROUP BY strftime('%Y', created_at)
     ORDER BY year ASC`,
    [],
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

app.get('/demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'demo.html'));
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
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

