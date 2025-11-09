let allItems = [];
let billItems = [];

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    calculateTotal();
    
    // Add auto-fetch customer name on mobile blur
    const mobileInput = document.getElementById('customerMobile');
    mobileInput.addEventListener('blur', autoFetchCustomerName);
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
        card.onclick = () => addItemToBill(item);
        card.innerHTML = `
            <h4>${item.name}</h4>
            <p>Price: ₹${parseFloat(item.price).toFixed(2)} (Incl. GST ${item.gst}%)</p>
        `;
        itemsList.appendChild(card);
    });
}

// Search items for billing
function searchItemsForBilling() {
    const searchTerm = document.getElementById('itemSearchInput').value.trim().toLowerCase();
    const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );
    displayItems(filtered);
}

// Auto-fetch customer name when mobile is entered
function autoFetchCustomerName() {
    const mobile = document.getElementById('customerMobile').value.trim();
    const nameInput = document.getElementById('customerName');
    const mobileInput = document.getElementById('customerMobile');
    
    if (!mobile || mobile.length < 6) {
        // Reset styling if mobile is cleared or too short
        mobileInput.style.backgroundColor = '';
        mobileInput.style.border = '';
        nameInput.readOnly = false;
        nameInput.style.backgroundColor = '';
        nameInput.title = '';
        return;
    }
    
    fetch(`/api/customers/search?mobile=${encodeURIComponent(mobile)}`)
        .then(response => response.json())
        .then(data => {
            if (data.found && data.customer_name) {
                // Highlight that existing customer was found
                mobileInput.style.backgroundColor = '#d4edda'; // Light green
                mobileInput.style.border = '2px solid #28a745'; // Green border
                
                // Auto-fill and lock customer name
                nameInput.value = data.customer_name;
                nameInput.readOnly = true;
                nameInput.style.backgroundColor = '#f5f5f5';
                nameInput.title = 'Customer name is locked because this mobile number exists in the system';
            } else {
                // Reset styling for new customer
                mobileInput.style.backgroundColor = '';
                mobileInput.style.border = '';
                nameInput.readOnly = false;
                nameInput.style.backgroundColor = '';
                nameInput.title = '';
            }
        })
        .catch(error => {
            console.error('Error fetching customer:', error);
        });
}

// Add item to bill
function addItemToBill(item) {
    // Check if item already exists in bill
    const existingItem = billItems.find(bi => bi.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        billItems.push({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            gst: parseFloat(item.gst),
            mrp: parseFloat(item.mrp || item.price),
            discount: parseFloat(item.discount || 0),
            quantity: 1
        });
    }
    
    updateBillTable();
    calculateTotal();
}

// Remove item from bill
function removeItemFromBill(index) {
    billItems.splice(index, 1);
    updateBillTable();
    calculateTotal();
}

// Calculate base price from inclusive price
// GST is calculated as percentage of inclusive price
// Example: ₹1000 with 20% GST = ₹200 GST, ₹800 base
function calculateBasePrice(inclusivePrice, gstRate) {
    return inclusivePrice * (100 - gstRate) / 100;
}

// Update bill table
function updateBillTable() {
    const tbody = document.getElementById('billTableBody');
    tbody.innerHTML = '';

    if (billItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No items in bill</td></tr>';
        return;
    }

    billItems.forEach((item, index) => {
        // Price is inclusive of GST
        const inclusiveTotal = item.price * item.quantity;
        const mrpPerUnit = item.mrp || item.price;
        const discountPercent = item.discount || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
                </div>
            </td>
            <td>₹${mrpPerUnit.toFixed(2)}</td>
            <td>${discountPercent.toFixed(1)}%</td>
            <td><strong>₹${inclusiveTotal.toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-danger" onclick="removeItemFromBill(${index})">Remove</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Increase quantity
function increaseQuantity(index) {
    billItems[index].quantity += 1;
    updateBillTable();
    calculateTotal();
}

// Decrease quantity
function decreaseQuantity(index) {
    if (billItems[index].quantity > 1) {
        billItems[index].quantity -= 1;
        updateBillTable();
        calculateTotal();
    }
}

// Calculate total
function calculateTotal() {
    let subtotal = 0;
    let totalGST = 0;
    let totalInclusive = 0;

    billItems.forEach(item => {
        // Price is inclusive of GST
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
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const total = totalInclusive - discount;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('cgst').textContent = `₹${cgst.toFixed(2)}`;
    document.getElementById('sgst').textContent = `₹${sgst.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${Math.max(0, total).toFixed(2)}`;
}

// Submit bill
function submitBill() {
    if (billItems.length === 0) {
        alert('Please add at least one item to the bill.');
        return;
    }

    const customerName = document.getElementById('customerName').value.trim();
    const customerMobile = document.getElementById('customerMobile').value.trim();
    
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

    billItems.forEach(item => {
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

    // Prepare invoice data
    const invoiceData = {
        customer_name: customerName,
        customer_mobile: customerMobile,
        items: billItems,
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        discount: discount,
        total: total
    };

    // Save invoice to database
    fetch('/api/invoices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            // Generate PDF
            generatePDF(invoiceData, data.id);
            // Show WhatsApp option
            showWhatsAppOption(invoiceData, data.id, customerMobile);
            // Reset form
            resetBill();
            alert('Bill submitted successfully! PDF is being generated.');
        }
    })
    .catch(error => {
        console.error('Error submitting bill:', error);
        alert('Error submitting bill. Please try again.');
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
    if (invoiceData.customer_gst) {
        doc.text(`GST No: ${invoiceData.customer_gst}`, 20, 64);
    }

    // Items Table
    let yPos = invoiceData.customer_gst ? 76 : 70;
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

// Show WhatsApp option
function showWhatsAppOption(invoiceData, invoiceId, mobile) {
    const message = formatInvoiceMessage(invoiceData, invoiceId);
    const whatsappLink = `https://wa.me/${mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    
    if (confirm('Bill created successfully! Would you like to send it via WhatsApp?')) {
        window.open(whatsappLink, '_blank');
    }
}

// Format invoice message for WhatsApp
function formatInvoiceMessage(invoiceData, invoiceId) {
    let message = `*Bombay Dyeing*\n`;
    message += `Bedding & Linen Shop\n\n`;
    message += `*Invoice #${invoiceId}*\n`;
    message += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    
    if (invoiceData.customer_name) {
        message += `Customer: ${invoiceData.customer_name}\n`;
    }
    if (invoiceData.customer_mobile) {
        message += `Mobile: ${invoiceData.customer_mobile}\n`;
    }
    message += `\n*Items:*\n`;
    
    invoiceData.items.forEach((item, index) => {
        const inclusiveTotal = item.price * item.quantity;
        const basePrice = calculateBasePrice(item.price, item.gst);
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;
        
        message += `${index + 1}. ${item.name}\n`;
        message += `   Qty: ${item.quantity} | Price: ₹${baseTotal.toFixed(2)} | GST: ₹${gstAmount.toFixed(2)} | Total: ₹${inclusiveTotal.toFixed(2)}\n`;
    });
    
    message += `\n*Summary:*\n`;
    message += `Subtotal: ₹${invoiceData.subtotal.toFixed(2)}\n`;
    message += `CGST: ₹${invoiceData.cgst.toFixed(2)}\n`;
    message += `SGST: ₹${invoiceData.sgst.toFixed(2)}\n`;
    
    if (invoiceData.discount > 0) {
        message += `Discount: -₹${invoiceData.discount.toFixed(2)}\n`;
    }
    
    message += `*Total: ₹${invoiceData.total.toFixed(2)}*\n\n`;
    message += `Thank you for your business!`;
    
    return message;
}

// Reset bill
function resetBill() {
    billItems = [];
    document.getElementById('customerForm').reset();
    document.getElementById('discount').value = 0;
    updateBillTable();
    calculateTotal();
}

