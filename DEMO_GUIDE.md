# 🎯 Bombay Dyeing POS - Demo Guide

## Quick Demo Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Populate Demo Data
```bash
npm run demo
```

This will create:
- ✅ 12 sample bedding and linen items
- ✅ 3 sample invoices with different customers
- ✅ Ready-to-test data

### Step 3: Start the Server
```bash
npm start
```

### Step 4: Open in Browser
```
http://localhost:3000/demo
```

## 🎬 Demo Walkthrough

### 1. Demo Page (`/demo`)
- **Purpose**: Feature showcase and overview
- **Features**: 
  - Visual feature cards
  - Statistics display
  - Quick navigation buttons
- **Action**: Click any button to explore features

### 2. Items Page (`/`)
- **What to Show**:
  - View all 12 sample items
  - Search functionality (try searching "Cotton")
  - Edit an item (click Edit button)
  - Add a new item
  - Remove an item
- **Demo Points**:
  - Items ordered by ID
  - Price is inclusive of GST
  - Full CRUD operations

### 3. Billing Page (`/billing`)
- **What to Show**:
  - Enter customer name and mobile (required)
  - Search and add items from database
  - Add multiple items with quantities
  - Apply discount
  - Real-time total calculation
  - Submit bill (generates PDF automatically)
- **Demo Points**:
  - Mandatory customer fields
  - Automatic GST calculation (CGST & SGST split)
  - PDF invoice generation

### 4. Invoices Page (`/invoices`)
- **What to Show**:
  - View all 3 sample invoices
  - Search by customer name or mobile
  - View detailed invoice (click View)
  - Download PDF (click Download PDF)
- **Demo Points**:
  - Complete invoice history
  - Search functionality
  - PDF download capability

## 🎨 Key Features to Highlight

1. **GST Inclusive Pricing**
   - All prices include GST
   - System calculates base price automatically
   - Example: ₹1000 with 20% GST = ₹800 base + ₹200 GST

2. **Real-time Calculations**
   - Totals update instantly
   - CGST and SGST split automatically
   - Discount applied correctly

3. **Professional Invoices**
   - Standard format PDF
   - Company branding
   - Complete itemized breakdown

4. **Complete CRUD Operations**
   - Create, Read, Update, Delete items
   - Full invoice management
   - Search across all modules

## 📊 Sample Data Included

### Items (12 total)
- Cotton Bedsheet Set (King Size) - ₹2500, 18% GST
- Premium Duvet Cover (Queen) - ₹1800, 18% GST
- Silk Pillow Covers (Pair) - ₹1200, 12% GST
- Cotton Blanket (Double) - ₹3200, 18% GST
- Bath Towel Set (4 Pieces) - ₹1500, 12% GST
- And 7 more items...

### Invoices (3 total)
1. **Rajesh Kumar** - 2 items, ₹200 discount
2. **Priya Sharma** - 2 items, no discount
3. **Amit Patel** - 3 items, ₹150 discount

## 🚀 Presentation Tips

1. **Start with Demo Page**: Shows overview of all features
2. **Items First**: Demonstrate inventory management
3. **Create a Bill**: Show the full billing process
4. **View Invoice**: Show invoice management and PDF
5. **Search Features**: Demonstrate search across all pages

## 💡 Demo Scenarios

### Scenario 1: New Customer Purchase
1. Go to Billing page
2. Enter: "Demo Customer", "9999999999"
3. Add: Cotton Bedsheet Set (2 qty)
4. Add: Silk Pillow Covers (1 qty)
5. Apply discount: ₹300
6. Submit bill
7. PDF downloads automatically

### Scenario 2: Edit Inventory
1. Go to Items page
2. Search for "Cotton"
3. Click Edit on any item
4. Change price or GST
5. Update item
6. Verify changes in table

### Scenario 3: Invoice Search
1. Go to Invoices page
2. Search for "Rajesh"
3. View invoice details
4. Download PDF
5. Show complete transaction history

## 🎯 Success Metrics to Show

- ✅ Fast item search
- ✅ Instant calculations
- ✅ Professional PDF invoices
- ✅ Complete data persistence
- ✅ User-friendly interface
- ✅ Mobile-responsive design

Enjoy your demo! 🎉

