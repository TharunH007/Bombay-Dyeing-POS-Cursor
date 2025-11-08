# Bombay Dyeing POS System

A complete Point of Sale (POS) website for Bombay Dyeing bedding and linen shop with full inventory management, billing, and invoice generation capabilities.

## 🎯 Features

### 📦 Item Management
- ✅ Add items to database (Item Name, GST %, Price - Inclusive of GST)
- ✅ Edit item details (Name, GST, Price)
- ✅ Remove items from database
- ✅ Search items by name
- ✅ View all items in a table (ordered by ID)
- ✅ Items stored with GST and price information

### 🧾 Billing System
- ✅ Add items from database to bill
- ✅ Remove items from bill
- ✅ Apply overall discount
- ✅ **Mandatory** customer name and mobile number
- ✅ Real-time total calculation with GST split (CGST & SGST)
- ✅ Submit bill which:
  - Saves invoice to database
  - Generates PDF invoice with standard format

### 📄 Invoice Management
- ✅ View all invoices in a table
- ✅ Search invoices by customer name or mobile number
- ✅ View detailed invoice information
- ✅ Download PDF invoices
- ✅ Complete transaction history

### 💰 GST Calculation
- ✅ Prices are **inclusive of GST**
- ✅ Automatic base price calculation
- ✅ GST split into CGST and SGST
- ✅ Supports different GST rates per item

## 📋 Invoice Format
- Company Name: Bombay Dyeing
- Invoice number and date
- Customer name and mobile number
- Items with quantity, base price, GST, and total
- Subtotal
- CGST and SGST split
- Discount (if applicable)
- Total amount

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Populate Demo Data (Optional)
To see the system with sample data:
```bash
npm run demo
```
This will add 12 sample items and 3 sample invoices to demonstrate all features.

### 3. Start the Server
```bash
npm start
```

### 4. Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

### 5. View Demo Page
For a feature overview, visit:
```
http://localhost:3000/demo
```

## 📖 Usage Guide

### Adding Items
1. Navigate to the **Items** page
2. Fill in the form:
   - Item Name (required)
   - GST % (required)
   - Price - Inclusive of GST (required)
3. Click "Add Item"

### Editing Items
1. Click the **Edit** button next to any item
2. Modify the details in the popup modal
3. Click "Update Item"

### Creating a Bill
1. Go to the **Billing** page
2. Enter **Customer Name** (required)
3. Enter **Mobile Number** (required)
4. Search and click items to add them to the bill
5. Adjust discount if needed
6. Click "Submit Bill" to:
   - Save the invoice
   - Automatically download PDF invoice

### Viewing Invoices
1. Navigate to the **Invoices** page
2. Browse all invoices or use search to filter
3. Click **View** to see full invoice details
4. Click **Download PDF** to get the invoice PDF

## 🎨 Pages Overview

- **Demo Page** (`/demo`) - Feature showcase and overview
- **Items Page** (`/`) - Manage inventory items
- **Billing Page** (`/billing`) - Create new bills
- **Invoices Page** (`/invoices`) - View and manage invoices

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite (local file: `pos.db`)
- **Frontend**: HTML, CSS, JavaScript
- **PDF Generation**: jsPDF
- **Styling**: Custom CSS with modern gradient design

## 📁 Project Structure

```
Curson BD App/
├── server.js              # Express server and API routes
├── demo-data.js           # Script to populate demo data
├── package.json           # Dependencies and scripts
├── pos.db                 # SQLite database (created automatically)
├── public/
│   ├── index.html         # Items management page
│   ├── billing.html       # Billing page
│   ├── invoices.html      # Invoices page
│   ├── demo.html          # Demo/landing page
│   ├── items.js           # Items page JavaScript
│   ├── billing.js         # Billing page JavaScript
│   ├── invoices.js        # Invoices page JavaScript
│   └── styles.css         # Global styles
└── README.md              # This file
```

## 🔑 Key Features

- **GST Inclusive Pricing**: All prices include GST, system calculates base price automatically
- **Real-time Calculations**: Instant updates as you add/remove items or change discount
- **Professional Invoices**: Standard format PDF invoices with company branding
- **Complete History**: All invoices saved with full details
- **Search Functionality**: Quick search across items and invoices
- **Responsive Design**: Works on desktop and mobile devices

## 📝 Notes

- Customer name and mobile number are **mandatory** for all bills
- Items are displayed ordered by ID (creation order)
- Database file (`pos.db`) is created automatically on first run
- All prices are inclusive of GST
- GST is calculated as a percentage of the inclusive price

## 🎯 Demo Mode

Run `npm run demo` to populate the database with sample data:
- 12 sample bedding and linen items
- 3 sample invoices with different customers
- Ready-to-use demo data for testing all features

Enjoy using the Bombay Dyeing POS System! 🎉

# Bombay-Dyeing-POS-Cursor
