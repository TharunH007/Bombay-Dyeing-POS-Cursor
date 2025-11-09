# Bombay Dyeing POS System

## Overview
A complete Point of Sale (POS) web application for Bombay Dyeing bedding and linen shop. Built with Node.js, Express, and SQLite, featuring inventory management, billing, quotations, invoice generation with PDF export, and sales dashboard.

**Current State**: Fully functional POS system with complete CRUD operations for items, invoices, and quotations.

## Recent Changes
- **2025-11-09**: Added per-item discount functionality to billing and quotations
  - Each item can have an individual discount applied at the unit level
  - Discount applies to GST-inclusive price (reduces both base and GST proportionally)
  - Added "Disc./Unit" column with inline input field for easy editing
  - Validation prevents negative discounts and discounts exceeding item price
  - Calculation: effectivePrice = max(unitPrice - discountPerUnit, 0)
  - Works alongside invoice-level discount for maximum flexibility
  - UI shows: Unit Price, Disc./Unit, Base (after discount), GST, Total
  - Implemented identically in both billing and quotations pages
  - Demo data includes quotations with various mobile formats for testing
- **2025-11-09**: Fixed WhatsApp multi-customer send feature
  - Replaced array index-based approach with data attribute method
  - Checkboxes now store customer data directly (data-mobile, data-name)
  - Eliminates index mismatch issues when search filters are applied
  - Multi-send now works reliably with any search/filter combination
- **2025-11-09**: Added auto-fetch customer data and business details updates
  - Auto-fetch customer name in billing page when mobile number is entered
  - Auto-fetch customer name, GST, and address in quotations page
  - Added optional customer address field to quotations
  - Customer GST and address included when converting quotation to invoice
  - Updated PDF invoice generation with NKM TRADING COMPANY business details:
    - Business: NKM TRADING COMPANY
    - Address: 114, Prince Manor, Purasawalkam High Road, Chennai - 600 010
    - GST: 33ACDPH9227M1ZG
    - Mobile: +91 9380742424
  - Customer address and GST number displayed in PDF invoices
  - Created `/api/customers/search` endpoint with robust mobile number matching
  - Handles all Indian mobile formats with spaces, dashes, parentheses, +91 prefix
- **2025-11-09**: Enhanced WhatsApp promotional messaging with customer selection
  - Added customer search to filter by name or mobile number
  - Implemented checkbox selection for cherry-picking customers
  - "Select All" and "Clear All" buttons for quick selection
  - "Send to Selected" feature to message multiple customers (1-second delay between each)
  - Real-time selection count display (X total, Y selected)
  - Improved readability with clean white background and better contrast
  - Empty state feedback for "no customers" and "no search matches"
- **2025-11-09**: Implemented WhatsApp promotional messaging feature
  - Added welcome page with free WhatsApp click-to-chat messaging
  - Loads customer list from invoices and quotations
  - Generates WhatsApp links with pre-filled promotional messages
  - 100% free solution - no API costs or external services required
  - Personalizes messages with customer names
  - Automatically formats mobile numbers for India (+91)
  - Handles all Indian formats: 0987..., +9198..., 9876..., etc.
- **2025-11-09**: Transformed UI to modern light theme
  - Changed from dark theme to sleek light design
  - New color scheme: White/light grey backgrounds with purple gradient accents
  - Improved readability and professional appearance
  - Enhanced shadows and modern rounded corners
  - Updated all pages with consistent light theme styling
- **2025-11-09**: Replaced Firebase backup with local file backup system
  - Removed Firebase dependencies (firebase-admin)
  - Implemented local JSON file backup system in `backups/` folder
  - Updated dashboard UI to show "Local Backup" instead of "Firebase Backup"
  - Removed automatic hourly backups (manual backups only)
  - Backup files saved with timestamps for version history
  - Maintains last 30 backups automatically
- **2025-11-09**: Fixed monthly sales chart display issue
  - Updated SQLite date queries to handle ISO 8601 format dates
  - Monthly sales chart now displays correctly with month labels
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
├── backup.js              # Local backup system
├── demo-data.js           # Script to populate sample data
├── package.json           # Node.js dependencies
├── pos.db                 # SQLite database (auto-created)
├── backups/               # Local backup files (JSON format)
└── public/                # Frontend static files
    ├── welcome.html       # Welcome page with WhatsApp messaging
    ├── index.html         # Item management page
    ├── billing.html       # Create invoices/bills
    ├── invoices.html      # View invoice history
    ├── quotations.html    # Create quotations
    ├── quotations-list.html  # View quotations
    ├── dashboard.html     # Sales analytics dashboard
    ├── demo.html          # Feature showcase
    ├── *.js               # Page-specific JavaScript
    └── styles.css         # Global styles (modern light theme)
```

### Database Schema
- **items**: id, name, gst (%), price (inclusive), created_at
- **invoices**: id, customer_name, customer_mobile, customer_gst, customer_address, items (JSON with discountPerUnit field), subtotal, cgst, sgst, discount, total, created_at
- **quotations**: id, customer_name, customer_mobile, customer_gst, customer_address, items (JSON with discountPerUnit field), subtotal, cgst, sgst, discount, total, created_at

**Items JSON Format:**
```json
[{
  "id": 1,
  "name": "Item Name",
  "price": 1000.00,
  "gst": 12,
  "quantity": 2,
  "discountPerUnit": 50.00
}]
```

### Key Features
1. **WhatsApp Messaging**: Free promotional messaging using click-to-chat links (no API costs), multi-customer send with search filters
2. **Item Management**: Add, edit, delete, search items with GST-inclusive pricing
3. **Billing System**: Create bills with automatic GST calculation (CGST/SGST split), per-item and invoice-level discounts
4. **Quotations**: Create quotations and convert them to invoices, per-item and quotation-level discounts
5. **Invoice History**: View, search, and download PDF invoices
6. **Dashboard**: Monthly/yearly sales analytics and top-selling items
7. **PDF Export**: Professional invoice PDFs with company branding
8. **Local Backup**: Manual backup system saves database to JSON files in `backups/` folder with restore capability

### API Endpoints
- Items: GET/POST/PUT/DELETE `/api/items`
- Invoices: GET/POST `/api/invoices`, GET `/api/invoices/:id`
- Quotations: GET/POST/DELETE `/api/quotations`, GET `/api/quotations/:id`, POST `/api/quotations/:id/convert`
- Customers: GET `/api/customers/search?mobile=XXX` (auto-fetch customer data)
- Dashboard: GET `/api/dashboard/monthly-total`, `/monthly-sales`, `/yearly-sales`, `/top-items`

## Development

### Running the Application
The server runs automatically on port 5000. Access the application through the Replit webview.

### Demo Data
To populate the database with sample items, invoices, and quotations:
```bash
npm run demo
```

Demo data includes:
- 10 sample bedding/linen items with GST-inclusive prices
- 5 sample invoices with various customer details
- 3 sample quotations testing different mobile formats and customer data combinations

### Environment
- Port: 5000 (configured for Replit)
- Host: 0.0.0.0 (allows Replit proxy access)
- Database: SQLite file at `./pos.db`

## User Preferences
- **Local-first architecture**: No cloud hosting dependencies, designed for local business operations
- **Free solutions preferred**: Implemented WhatsApp click-to-chat instead of paid SMS/messaging APIs
- **Modern light theme**: Professional appearance with light backgrounds and clean design

## Technical Notes
- **WhatsApp Integration**: Uses wa.me links instead of Twilio API (user declined paid integration)
- User dismissed Twilio connector - free click-to-chat solution implemented instead
- WhatsApp links format: `https://wa.me/{mobile}?text={message}`
- Mobile numbers automatically formatted with +91 prefix for India
