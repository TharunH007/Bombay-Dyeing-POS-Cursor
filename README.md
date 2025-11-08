# Bombay Dyeing POS System

A simple Point of Sale (POS) website for Bombay Dyeing bedding and linen shop.

## Features

### Page 1: Item Management
- Add items to database (Item Name, GST %, Price)
- Remove items from database
- Search items by name
- View all items in a table

### Page 2: Billing
- Add items from database to bill
- Remove items from bill
- Apply overall discount
- Enter customer name and mobile number
- Submit bill which:
  - Saves invoice to database
  - Generates PDF invoice with standard format

## Invoice Format
- Company Name: Bombay Dyeing
- Date of bill
- Items with quantity, price, GST, and total
- Subtotal
- CGST and SGST split
- Discount
- Total amount

## Setup Instructions

1. Install Node.js (if not already installed)

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Add Items**: Go to the Items page, fill in the form with item name, GST percentage, and price, then click "Add Item"

2. **Create Bill**: 
   - Go to the Billing page
   - Enter customer information (optional)
   - Search and click items to add them to the bill
   - Adjust discount if needed
   - Click "Submit Bill" to save and generate PDF

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **PDF Generation**: jsPDF

# Bombay-Dyeing-POS-Cursor
