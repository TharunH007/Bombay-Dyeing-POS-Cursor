let allItems = [];
let quotationItems = [];

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    calculateTotal();
    
    // Add auto-fetch customer data on mobile blur
    const mobileInput = document.getElementById('customerMobile');
    mobileInput.addEventListener('blur', autoFetchCustomerData);
});

// Load all items for selection
function loadItems() {
    fetch('/api/items')
        .then(response => response.json())
        .then(data => {
            allItems = data;
            displayItems(data);
        })
        .catch(error => {
            console.error('Error loading items:', error);
            alert('Error loading items. Please try again.');
        });
}

// Display items in left panel
function displayItems(items) {
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    if (items.length === 0) {
        itemsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No items available. Please add items first.</p>';
        return;
    }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.onclick = () => addItemToQuotation(item);
        card.innerHTML = `
            <h4>${item.name}</h4>
            <p>Price: ₹${parseFloat(item.price).toFixed(2)} (Incl. GST ${item.gst}%)</p>
        `;
        itemsList.appendChild(card);
    });
}

// Search items for quotation
function searchItemsForQuotation() {
    const searchTerm = document.getElementById('itemSearchInput').value.trim().toLowerCase();
    const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    displayItems(filtered);
}

// Auto-fetch customer data when mobile is entered
function autoFetchCustomerData() {
    const mobile = document.getElementById('customerMobile').value.trim();
    const nameInput = document.getElementById('customerName');
    const gstInput = document.getElementById('customerGst');
    const addressInput = document.getElementById('customerAddress');
    
    if (!mobile) return;
    
    fetch(`/api/customers/search?mobile=${encodeURIComponent(mobile)}`)
        .then(response => response.json())
        .then(data => {
            if (data.found) {
                if (data.customer_name && !nameInput.value) {
                    nameInput.value = data.customer_name;
                }
                if (data.customer_gst && !gstInput.value) {
                    gstInput.value = data.customer_gst;
                }
                if (data.customer_address && !addressInput.value) {
                    addressInput.value = data.customer_address;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching customer:', error);
        });
}

// Add item to quotation
function addItemToQuotation(item) {
    // Check if item already exists in quotation
    const existingItem = quotationItems.find(qi => qi.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        quotationItems.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            gst: parseFloat(item.gst),
            quantity: 1,
            discountPerUnit: 0
        });
    }
    
    updateQuotationTable();
    calculateTotal();
}

// Remove item from quotation
function removeItemFromQuotation(index) {
    quotationItems.splice(index, 1);
    updateQuotationTable();
    calculateTotal();
}

// Calculate base price from inclusive price
function calculateBasePrice(inclusivePrice, gstRate) {
    return inclusivePrice * (100 - gstRate) / 100;
}

// Update quotation table
function updateQuotationTable() {
    const tbody = document.getElementById('quotationTableBody');
    tbody.innerHTML = '';

    if (quotationItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No items in quotation</td></tr>';
        return;
    }

    quotationItems.forEach((item, index) => {
        // Apply per-unit discount to calculate effective unit price
        const discountPerUnit = parseFloat(item.discountPerUnit) || 0;
        const effectiveUnitPrice = Math.max(item.price - discountPerUnit, 0);
        
        // Calculate totals from effective price
        const inclusiveTotal = effectiveUnitPrice * item.quantity;
        const basePrice = calculateBasePrice(effectiveUnitPrice, item.gst);
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuotationQuantity(${index})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="increaseQuotationQuantity(${index})">+</button>
                </div>
            </td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>
                <input type="number" min="0" max="${item.price}" step="1" 
                       value="${discountPerUnit}" 
                       onchange="updateQuotationItemDiscount(${index}, this.value)"
                       onclick="event.stopPropagation()"
                       style="width: 70px; padding: 4px; border: 1px solid #cbd5e0; border-radius: 4px;">
            </td>
            <td>₹${baseTotal.toFixed(2)}</td>
            <td>₹${gstAmount.toFixed(2)}</td>
            <td><strong>₹${inclusiveTotal.toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-danger" onclick="removeItemFromQuotation(${index})">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Update item discount
function updateQuotationItemDiscount(index, value) {
    const discount = parseFloat(value) || 0;
    const item = quotationItems[index];
    
    // Validate: discount must be >= 0 and < item price
    if (discount < 0) {
        quotationItems[index].discountPerUnit = 0;
        alert('Discount cannot be negative!');
    } else if (discount >= item.price) {
        quotationItems[index].discountPerUnit = item.price - 0.01;
        alert(`Discount cannot be equal to or exceed the item price (₹${item.price.toFixed(2)})`);
    } else {
        quotationItems[index].discountPerUnit = discount;
    }
    
    updateQuotationTable();
    calculateTotal();
}

// Increase quantity
function increaseQuotationQuantity(index) {
    quotationItems[index].quantity += 1;
    updateQuotationTable();
    calculateTotal();
}

// Decrease quantity
function decreaseQuotationQuantity(index) {
    if (quotationItems[index].quantity > 1) {
        quotationItems[index].quantity -= 1;
        updateQuotationTable();
        calculateTotal();
    }
}

// Calculate total
function calculateTotal() {
    let subtotal = 0;
    let totalGST = 0;
    let totalInclusive = 0;

    quotationItems.forEach(item => {
        // Apply per-unit discount to calculate effective unit price
        const discountPerUnit = parseFloat(item.discountPerUnit) || 0;
        const effectiveUnitPrice = Math.max(item.price - discountPerUnit, 0);
        
        // Calculate totals from effective price
        const inclusiveTotal = effectiveUnitPrice * item.quantity;
        const basePrice = calculateBasePrice(effectiveUnitPrice, item.gst);
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;
        
        subtotal += baseTotal;
        totalGST += gstAmount;
        totalInclusive += inclusiveTotal;
    });

    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = totalInclusive - discount;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cgst').textContent = `₹${cgst.toFixed(2)}`;
    document.getElementById('sgst').textContent = `₹${sgst.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${Math.max(0, total).toFixed(2)}`;
}

// Create quotation
function createQuotation() {
    if (quotationItems.length === 0) {
        alert('Please add at least one item to the quotation.');
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerMobile = document.getElementById('customerMobile').value.trim();
    const customerGst = document.getElementById('customerGst').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    
    if (!customerName) {
        alert('Customer Name is required.');
        document.getElementById('customerName').focus();
        return;
    }
    
    if (!customerMobile) {
        alert('Mobile Number is required.');
        document.getElementById('customerMobile').focus();
        return;
    }
    
    const discount = parseFloat(document.getElementById('discount').value) || 0;

    // Calculate totals (price is inclusive of GST)
    let subtotal = 0;
    let totalGST = 0;
    let totalInclusive = 0;

    quotationItems.forEach(item => {
        const inclusiveTotal = item.price * item.quantity;
        const basePrice = calculateBasePrice(item.price, item.gst);
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;
        
        subtotal += baseTotal;
        totalGST += gstAmount;
        totalInclusive += inclusiveTotal;
    });

    const cgst = totalGST / 2;
    const sgst = totalGST / 2;
    const total = Math.max(0, totalInclusive - discount);

    // Prepare quotation data
    const quotationData = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        customer_gst: customerGst || null,
        customer_address: customerAddress || null,
        items: quotationItems,
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        discount: discount,
        total: total
    };

    // Save quotation to database
    fetch('/api/quotations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(quotationData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            // Reset form
            resetQuotation();
            alert('Quotation created successfully!');
            // Optionally redirect to quotations list
            window.location.href = '/quotations-list';
        }
    })
    .catch(error => {
        console.error('Error creating quotation:', error);
        alert('Error creating quotation. Please try again.');
    });
}

// Generate PDF invoice
function generatePDF(invoiceData, invoiceId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Bombay Dyeing', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Bedding & Linen Shop', 105, 28, { align: 'center' });

    // Invoice Details
    doc.setFontSize(10);
    doc.text(`Invoice #: ${invoiceId}`, 20, 40);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 46);
    
    if (invoiceData.customer_name) {
        doc.text(`Customer: ${invoiceData.customer_name}`, 20, 52);
    }
    if (invoiceData.customer_mobile) {
        doc.text(`Mobile: ${invoiceData.customer_mobile}`, 20, 58);
    }

    // Items Table
    let yPos = 70;
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, yPos);
    doc.text('Qty', 80, yPos);
    doc.text('Price', 100, yPos);
    doc.text('GST', 130, yPos);
    doc.text('Total', 160, yPos);

    yPos += 5;
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPos, 190, yPos);

    yPos += 8;
    doc.setFont(undefined, 'normal');

    invoiceData.items.forEach(item => {
        // Price is inclusive of GST
        const inclusiveTotal = item.price * item.quantity;
        const basePrice = calculateBasePrice(item.price, item.gst);
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;

        doc.text(item.name, 20, yPos);
        doc.text(item.quantity.toString(), 80, yPos);
        doc.text(`₹${baseTotal.toFixed(2)}`, 100, yPos);
        doc.text(`₹${gstAmount.toFixed(2)}`, 130, yPos);
        doc.text(`₹${inclusiveTotal.toFixed(2)}`, 160, yPos);
        yPos += 7;
    });

    // Summary
    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 8;

    doc.text(`Subtotal: ₹${invoiceData.subtotal.toFixed(2)}`, 130, yPos);
    yPos += 7;
    doc.text(`CGST: ₹${invoiceData.cgst.toFixed(2)}`, 130, yPos);
    yPos += 7;
    doc.text(`SGST: ₹${invoiceData.sgst.toFixed(2)}`, 130, yPos);
    yPos += 7;
    
    if (invoiceData.discount > 0) {
        doc.text(`Discount: -₹${invoiceData.discount.toFixed(2)}`, 130, yPos);
        yPos += 7;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`Total: ₹${invoiceData.total.toFixed(2)}`, 130, yPos);

    // Footer
    yPos = 280;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

    // Save PDF
    const fileName = `Bombay_Dyeing_Invoice_${invoiceId}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Reset quotation
function resetQuotation() {
    quotationItems = [];
    document.getElementById('customerForm').reset();
    document.getElementById('discount').value = 0;
    updateQuotationTable();
    calculateTotal();
}

