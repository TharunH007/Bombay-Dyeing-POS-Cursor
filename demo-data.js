const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./pos.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    populateDemoData();
  }
});

function populateDemoData() {
  // Clear existing data
  db.run('DELETE FROM items', (err) => {
    if (err) {
      console.error('Error clearing items:', err.message);
    } else {
      console.log('Cleared existing items');
    }
  });

  db.run('DELETE FROM invoices', (err) => {
    if (err) {
      console.error('Error clearing invoices:', err.message);
    } else {
      console.log('Cleared existing invoices');
    }
  });

  db.run('DELETE FROM quotations', (err) => {
    if (err) {
      console.error('Error clearing quotations:', err.message);
    } else {
      console.log('Cleared existing quotations');
    }
  });

  // Sample items for bedding and linen shop
  const sampleItems = [
    { name: 'Cotton Bedsheet Set (King Size)', gst: 18, price: 2500 },
    { name: 'Premium Duvet Cover (Queen)', gst: 18, price: 1800 },
    { name: 'Silk Pillow Covers (Pair)', gst: 12, price: 1200 },
    { name: 'Cotton Blanket (Double)', gst: 18, price: 3200 },
    { name: 'Bath Towel Set (4 Pieces)', gst: 12, price: 1500 },
    { name: 'Cotton Curtains (Pair)', gst: 18, price: 2800 },
    { name: 'Mattress Protector (King)', gst: 12, price: 950 },
    { name: 'Bed Runner (Queen)', gst: 12, price: 850 },
    { name: 'Table Linen Set (6 Pieces)', gst: 12, price: 2200 },
    { name: 'Cotton Quilt Cover (King)', gst: 18, price: 2100 },
    { name: 'Bath Mat Set (3 Pieces)', gst: 12, price: 750 },
    { name: 'Premium Bedspread (King)', gst: 18, price: 4500 }
  ];

  // Insert sample items
  const insertItem = db.prepare('INSERT INTO items (name, gst, price) VALUES (?, ?, ?)');
  
  sampleItems.forEach((item, index) => {
    insertItem.run([item.name, item.gst, item.price], function(err) {
      if (err) {
        console.error(`Error inserting item ${item.name}:`, err.message);
      } else {
        console.log(`✓ Added: ${item.name}`);
      }
      
      // After all items are inserted, create sample invoices
      if (index === sampleItems.length - 1) {
        insertItem.finalize();
        setTimeout(() => createSampleInvoices(), 500);
      }
    });
  });
}

function createSampleInvoices() {
  // Get all items first
  db.all('SELECT * FROM items ORDER BY id ASC', (err, items) => {
    if (err) {
      console.error('Error fetching items:', err.message);
      db.close();
      return;
    }

    // Sample invoices
    const sampleInvoices = [
      {
        customer_name: 'Rajesh Kumar',
        customer_mobile: '9876543210',
        items: [
          { id: items[0].id, name: items[0].name, price: items[0].price, gst: items[0].gst, quantity: 2 },
          { id: items[2].id, name: items[2].name, price: items[2].price, gst: items[2].gst, quantity: 1 }
        ],
        discount: 200
      },
      {
        customer_name: 'Priya Sharma',
        customer_mobile: '9876543211',
        items: [
          { id: items[1].id, name: items[1].name, price: items[1].price, gst: items[1].gst, quantity: 1 },
          { id: items[4].id, name: items[4].name, price: items[4].price, gst: items[4].gst, quantity: 2 }
        ],
        discount: 0
      },
      {
        customer_name: 'Amit Patel',
        customer_mobile: '9876543212',
        items: [
          { id: items[3].id, name: items[3].name, price: items[3].price, gst: items[3].gst, quantity: 1 },
          { id: items[6].id, name: items[6].name, price: items[6].price, gst: items[6].gst, quantity: 1 },
          { id: items[7].id, name: items[7].name, price: items[7].price, gst: items[7].gst, quantity: 1 }
        ],
        discount: 150
      }
    ];

    // Calculate totals for each invoice
    sampleInvoices.forEach((invoice, index) => {
      let subtotal = 0;
      let totalGST = 0;
      let totalInclusive = 0;

      invoice.items.forEach(item => {
        const inclusiveTotal = item.price * item.quantity;
        const basePrice = item.price * (100 - item.gst) / 100;
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;
        
        subtotal += baseTotal;
        totalGST += gstAmount;
        totalInclusive += inclusiveTotal;
      });

      const cgst = totalGST / 2;
      const sgst = totalGST / 2;
      const total = Math.max(0, totalInclusive - invoice.discount);

      const itemsJson = JSON.stringify(invoice.items);

      // Create invoices with dates spread across the last 3 months
      const daysAgo = [2, 15, 30, 45, 60, 75, 90][index] || 5;
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);
      const createdAt = invoiceDate.toISOString();

      db.run(
        'INSERT INTO invoices (customer_name, customer_mobile, customer_gst, items, subtotal, cgst, sgst, discount, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [invoice.customer_name, invoice.customer_mobile, null, itemsJson, subtotal, cgst, sgst, invoice.discount, total, createdAt],
        function(err) {
          if (err) {
            console.error(`Error inserting invoice ${index + 1}:`, err.message);
          } else {
            console.log(`✓ Created invoice #${this.lastID} for ${invoice.customer_name} (${createdAt.split('T')[0]})`);
          }

          if (index === sampleInvoices.length - 1) {
            setTimeout(() => createSampleQuotations(items), 500);
          }
        }
      );
    });
  });
}

function createSampleQuotations(items) {
  // Sample quotations
  const sampleQuotations = [
    {
      customer_name: 'Sunita Reddy',
      customer_mobile: '+91 9876543213',
      customer_gst: '33ACDPH9227M1ZG',
      customer_address: 'Flat 402, Green Valley Apartments, Anna Nagar, Chennai - 600040',
      items: [
        { id: items[11].id, name: items[11].name, price: items[11].price, gst: items[11].gst, quantity: 1 },
        { id: items[9].id, name: items[9].name, price: items[9].price, gst: items[9].gst, quantity: 2 }
      ],
      discount: 300
    },
    {
      customer_name: 'Vikram Singh',
      customer_mobile: '98765-43214',
      customer_gst: '29ABCDE1234F1Z5',
      customer_address: 'House No. 12, MG Road, Bangalore - 560001',
      items: [
        { id: items[5].id, name: items[5].name, price: items[5].price, gst: items[5].gst, quantity: 2 },
        { id: items[8].id, name: items[8].name, price: items[8].price, gst: items[8].gst, quantity: 1 }
      ],
      discount: 0
    },
    {
      customer_name: 'Meera Krishnan',
      customer_mobile: '(987) 654-3215',
      customer_gst: null,
      customer_address: null,
      items: [
        { id: items[0].id, name: items[0].name, price: items[0].price, gst: items[0].gst, quantity: 3 },
        { id: items[4].id, name: items[4].name, price: items[4].price, gst: items[4].gst, quantity: 1 },
        { id: items[10].id, name: items[10].name, price: items[10].price, gst: items[10].gst, quantity: 2 }
      ],
      discount: 500
    }
  ];

  // Calculate totals for each quotation
  sampleQuotations.forEach((quotation, index) => {
    let subtotal = 0;
    let totalGST = 0;
    let totalInclusive = 0;

    quotation.items.forEach(item => {
      const inclusiveTotal = item.price * item.quantity;
      const basePrice = item.price * (100 - item.gst) / 100;
      const baseTotal = basePrice * item.quantity;
      const gstAmount = inclusiveTotal - baseTotal;
      
      subtotal += baseTotal;
      totalGST += gstAmount;
      totalInclusive += inclusiveTotal;
    });

    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const total = Math.max(0, totalInclusive - quotation.discount);

    const itemsJson = JSON.stringify(quotation.items);

    // Create quotations with dates spread across recent days
    const daysAgo = [1, 5, 10][index] || 1;
    const quotationDate = new Date();
    quotationDate.setDate(quotationDate.getDate() - daysAgo);
    const createdAt = quotationDate.toISOString();

    db.run(
      'INSERT INTO quotations (customer_name, customer_mobile, customer_gst, customer_address, items, subtotal, cgst, sgst, discount, total, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [quotation.customer_name, quotation.customer_mobile, quotation.customer_gst, quotation.customer_address, itemsJson, subtotal, cgst, sgst, quotation.discount, total, createdAt],
      function(err) {
        if (err) {
          console.error(`Error inserting quotation ${index + 1}:`, err.message);
        } else {
          console.log(`✓ Created quotation #${this.lastID} for ${quotation.customer_name} (${createdAt.split('T')[0]})`);
        }

        if (index === sampleQuotations.length - 1) {
          console.log('\n✅ Demo data populated successfully!');
          console.log(`   - 12 items added`);
          console.log(`   - 3 sample invoices created`);
          console.log(`   - 3 sample quotations created`);
          console.log('\n🚀 You can now start the server and view the demo!');
          db.close();
        }
      }
    );
  });
}

