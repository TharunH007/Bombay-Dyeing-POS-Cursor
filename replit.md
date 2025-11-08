# Bombay Dyeing POS System

## Overview
A complete Point of Sale (POS) web application for Bombay Dyeing bedding and linen shop. Built with Node.js, Express, and SQLite, featuring inventory management, billing, quotations, invoice generation with PDF export, and sales dashboard.

**Current State**: Fully functional POS system with complete CRUD operations for items, invoices, and quotations.

## Recent Changes
- **2025-11-08**: Reorganized navigation into logical groups
  - Grouped "Billing" and "Invoices" under "Billing & Invoices"
  - Placed "Items" under "Inventory" group
  - Grouped "Create Quotation" and "Quotation List" under "Quotations"
  - Added navigation group titles and improved visual hierarchy
- **2025-11-08**: Imported from GitHub and configured for Replit environment
  - Updated server to run on port 5000 (required for Replit)
  - Changed binding from localhost to 0.0.0.0 for Replit proxy
  - Added cache control headers to prevent iframe caching issues
  - Configured workflow for automatic server startup

## Project Architecture

### Technology Stack
- **Backend**: Node.js with Express framework
- **Database**: SQLite (local file-based database at `./pos.db`)
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **PDF Generation**: jsPDF library

### Directory Structure
```
├── server.js              # Express server with all API routes
├── demo-data.js           # Script to populate sample data
├── package.json           # Node.js dependencies
├── pos.db                 # SQLite database (auto-created)
└── public/                # Frontend static files
    ├── index.html         # Item management page
    ├── billing.html       # Create invoices/bills
    ├── invoices.html      # View invoice history
    ├── quotations.html    # Create quotations
    ├── quotations-list.html  # View quotations
    ├── dashboard.html     # Sales analytics dashboard
    ├── demo.html          # Feature showcase
    ├── *.js               # Page-specific JavaScript
    └── styles.css         # Global styles
```

### Database Schema
- **items**: id, name, gst (%), price (inclusive), created_at
- **invoices**: id, customer_name, customer_mobile, items (JSON), subtotal, cgst, sgst, discount, total, created_at
- **quotations**: Same structure as invoices

### Key Features
1. **Item Management**: Add, edit, delete, search items with GST-inclusive pricing
2. **Billing System**: Create bills with automatic GST calculation (CGST/SGST split)
3. **Quotations**: Create quotations and convert them to invoices
4. **Invoice History**: View, search, and download PDF invoices
5. **Dashboard**: Monthly/yearly sales analytics and top-selling items
6. **PDF Export**: Professional invoice PDFs with company branding

### API Endpoints
- Items: GET/POST/PUT/DELETE `/api/items`
- Invoices: GET/POST `/api/invoices`
- Quotations: GET/POST/DELETE `/api/quotations`, POST `/api/quotations/:id/convert`
- Dashboard: GET `/api/dashboard/monthly-total`, `/monthly-sales`, `/yearly-sales`, `/top-items`

## Development

### Running the Application
The server runs automatically on port 5000. Access the application through the Replit webview.

### Demo Data
To populate the database with sample items and invoices:
```bash
npm run demo
```

### Environment
- Port: 5000 (configured for Replit)
- Host: 0.0.0.0 (allows Replit proxy access)
- Database: SQLite file at `./pos.db`

## User Preferences
None specified yet.
