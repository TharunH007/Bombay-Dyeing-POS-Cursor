# Bombay Dyeing POS System - AI Coding Agent Instructions

## Project Overview
A full-stack Point of Sale system for bedding/linen retail with inventory management, billing, invoice tracking, and quotations. **Express.js** backend (Node.js), **SQLite3** database, vanilla JavaScript frontend. Runs on port 5000.

## Architecture & Key Components

### Backend Architecture (server.js)
- **Express API Server** with 20+ endpoints for items, invoices, quotations, customers, and dashboard analytics
- **SQLite3 Database** with 3 core tables:
  - `items`: Product catalog (id, name, gst%, mrp, discount, calculated_price, stock)
  - `invoices`: Finalized sales transactions with GST split (customer details, items array, totals)
  - `quotations`: Pending quotes that can be converted to invoices
- **Customer Search**: Mobile number normalization & lookup across invoices/quotations (handles 10-digit, +91 prefixes, formatted numbers)
- **Backup System** (backup.js): Exports all tables to JSON; `npm run reset` clears database

### Critical Business Logic: GST Calculation
**Prices are INCLUSIVE of GST** - this differs from typical add-on GST:
```javascript
// Backend (server.js line ~276): Price = MRP * (1 - discount%)
// Frontend (billing.js line 135): basePrice = inclusivePrice * (100 - gstRate) / 100
// Example: ₹1000 price + 18% GST = ₹823 base, ₹177 tax (NOT ₹1180)
```
- GST split into **CGST & SGST** (each = gst% / 2)
- Both frontend (multiple .js files) and backend validate calculations—keep them in sync
- **Item data model**: Stores both `mrp` (marked price) and `discount%` separately; `price` is calculated field

### Frontend Architecture (public/)
- **Multi-page SPA**: Items, Billing, Invoices, Quotations, Dashboard (navigation via `index.html`)
- **Pattern**: Each page has HTML + dedicated JS file (items.js, billing.js, invoices.js, quotations.js, dashboard.js)
- **Data Flow**: fetch() calls to `/api/*` endpoints → data stored in local arrays (allItems, billItems, etc.) → DOM updates
- **Common Utilities**:
  - `calculateBasePrice(inclusivePrice, gstRate)`: Reverse-calculate base from inclusive price
  - `calculateTotal()`: Sums bill items with GST splits and applies discount
  - Modal popups for edit/delete confirmations (billing.js, items.js)

### Database Schema Patterns
- **Dynamic Table Extensions**: `PRAGMA table_info` checks on startup (server.js lines 120-170) add missing columns to support feature evolution (e.g., customer_gst, customer_address)
- **Items stored with both MRP and final price**: Allows showing original vs. discounted pricing in invoices
- **Invoice/Quotation items field**: JSON stringified array of item objects (not normalized to separate table—query as-is)

## Developer Workflows

### Starting Development
```powershell
npm install              # Install dependencies (express, sqlite3, cors, body-parser, jspdf)
npm run demo            # Populate sample data (12 items, 3 invoices, 3 quotations)
npm start               # Launch server on port 5000
npm run reset           # Clear database (uses reset-database.js)
```

### Database Management
- **Database file**: `pos.db` at root; `pos.db-journal` is SQLite temp file (ignore)
- **Backup files**: Stored in `backups/` folder; `latest-backup.json` is symlink for last backup
- **Add/modify schema**: Update SQL in `initializeDatabase()` (server.js ~40) and document in comments

### Frontend Testing
- Open `http://localhost:5000/` for main interface
- `/demo` page shows feature overview
- Each page (Billing, Items, Invoices, Quotations) is independent—test in isolation if adding features

## Code Patterns & Conventions

### API Response Format
```javascript
// Success: return JSON object with data
res.json({ id: 123, name: "item", price: 500 });

// Error: use status codes + error message object
res.status(400).json({ error: 'Item with this name already exists in database' });
```

### Duplicate Prevention
- Item names checked case-insensitive (`LOWER(name)`) before insert/update (server.js ~295, ~330)
- Apply same pattern when adding new unique constraints

### Mobile Number Handling
- Always normalize before lookup: `normalizeMobile()` (server.js ~193) strips formatting, handles country codes
- When searching: use SQL REPLACE chain to strip hyphens/parentheses in DB query itself
- Minimum 6 digits to prevent spurious matches; slice last 10 if longer

### Price Calculations in Frontend
- **Always re-calculate** from item's GST rate + inclusive price (never trust rounded values from server)
- Show both base price and tax breakdown in bills (see billing.js table generation)
- Apply bill-level discount AFTER summing item totals, not per-item

### Invoice/Quotation Lifecycle
- **Quotation** (quotations table): Draft saved with customer/items/totals but not finalized
- **Convert Quotation to Invoice** (POST /api/quotations/:id/convert): Creates new invoice row, marks quotation as converted
- **Items field**: Stores JSON array; parse on retrieval with `JSON.parse()` in frontend

### Form Submission Pattern (Frontend)
```javascript
document.getElementById('addItemForm').addEventListener('submit', (e) => {
  e.preventDefault();  // Standard pattern across all forms
  addItem();           // Call handler to POST to API
});
```

### Dashboard Aggregations (server.js ~680+)
- `/api/dashboard/monthly-report`: Aggregates invoices by month; returns { month, total, count }
- `/api/dashboard/top-items`: Parses items JSON from invoices, counts occurrences
- Complex SQL with GROUP BY and DATE functions; test with sample data before modifying

## Common Pitfalls & Gotchas

1. **GST Calculation Direction**: If adding feature using GST, verify formula direction—inclusive-of (current) vs. add-on (common)
2. **Item Deletion**: Hard delete only—no soft delete implemented. Archive old items before deleting if audit trail needed
3. **Backup Restoration**: backup.js uses INSERT with explicit IDs—can break auto-increment if IDs not preserved
4. **Async/Sync Mismatch**: backup.js uses Promises; server.js uses callbacks; mixing requires careful error handling
5. **Mobile Search**: Edge case—empty mobile field returns no results (OK), but avoid querying with only country code
6. **JSON Parsing**: Invoice items array is stringified—remember to `JSON.parse(invoice.items)` when displaying

## File Structure Essentials
```
server.js              # Main Express server, all API endpoints, schema initialization
backup.js             # Database backup/restore utilities
public/
  index.html          # Navigation hub, loads all page HTML
  billing.html        # Bill creation UI
  billing.js          # Billing logic (add items, calculate GST, submit)
  items.html          # Item management CRUD
  items.js            # Item add/edit/delete handlers
  invoices.html       # View finalized sales
  invoices.js         # Invoice search & display
  quotations.html     # View pending quotes
  quotations.js       # Quote create/convert/delete
  dashboard.html      # Sales analytics
  dashboard.js        # Fetch & render monthly/yearly reports, top items
  styles.css          # Unified styling (gradient header, table formatting)
```

## Quick Reference: Adding a New Feature

**Example: Add "tax-exempt" flag to items**
1. Backend: `ALTER TABLE items ADD COLUMN tax_exempt BOOLEAN DEFAULT 0` in `initializeDatabase()` 
2. API: Modify POST/PUT `/api/items` to accept tax_exempt parameter; validate GST = 0 if tax_exempt
3. Frontend: Add checkbox in items.js form; pass in request body
4. Calculation: In billing.js, check flag before applying GST in `calculateTotal()`
5. Display: Update item card (billing.js line ~37) to show "Tax Exempt" badge if flag set
6. Test: Add demo item with flag; create bill to verify GST=0 in calculation

## Testing & Debugging
- **Browser DevTools**: Network tab to inspect API requests/responses; Console for fetch errors
- **Database inspection**: Use SQLite command-line or VS Code SQLite extension to query pos.db directly
- **Server logs**: Check console output from `npm start` for SQL errors or table creation issues
- **Reset workflow**: Always `npm run reset` before creating test data to avoid interference
