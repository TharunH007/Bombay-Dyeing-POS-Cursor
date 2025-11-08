let allInvoices = [];

// Load invoices on page load
document.addEventListener('DOMContentLoaded', () => {
    loadInvoices();
});

// Load all invoices
function loadInvoices() {
    fetch('/api/invoices')
        .then(response => response.json())
        .then(data => {
            allInvoices = data;
            displayInvoices(data);
        })
        .catch(error => {
            console.error('Error loading invoices:', error);
            alert('Error loading invoices. Please try again.');
        });
}

// Display invoices in table
function displayInvoices(invoices) {
    const tbody = document.getElementById('invoicesTableBody');
    tbody.innerHTML = '';

    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No invoices found</td></tr>';
        return;
    }

    invoices.forEach(invoice => {
        const date = new Date(invoice.created_at).toLocaleDateString('en-IN');
        const itemsCount = invoice.items ? invoice.items.length : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${invoice.id}</td>
            <td>${date}</td>
            <td>${invoice.customer_name || '-'}</td>
            <td>${invoice.customer_mobile || '-'}</td>
            <td>${itemsCount} item(s)</td>
            <td>₹${parseFloat(invoice.total).toFixed(2)}</td>
            <td>
                <button class="btn btn-primary" style="margin-right: 5px;" onclick="viewInvoice(${invoice.id})">View</button>
                <button class="btn btn-success" style="margin-right: 5px;" onclick="downloadPDF(${invoice.id})">Download PDF</button>
                <button class="btn" style="background: #25D366; color: white; margin-right: 5px;" onclick="sendViaWhatsApp(${invoice.id})">WhatsApp</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Search invoices
function searchInvoices() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayInvoices(allInvoices);
        return;
    }
    
    const filtered = allInvoices.filter(invoice => {
        const name = (invoice.customer_name || '').toLowerCase();
        const mobile = (invoice.customer_mobile || '').toLowerCase();
        return name.includes(searchTerm) || mobile.includes(searchTerm);
    });
    
    displayInvoices(filtered);
}

// View invoice details
function viewInvoice(id) {
    fetch(`/api/invoices/${id}`)
        .then(response => response.json())
        .then(invoice => {
            showInvoiceModal(invoice);
        })
        .catch(error => {
            console.error('Error loading invoice:', error);
            alert('Error loading invoice. Please try again.');
        });
}

// Show invoice modal
function showInvoiceModal(invoice) {
    const date = new Date(invoice.created_at).toLocaleDateString('en-IN');
    let itemsHtml = '';
    
    if (invoice.items && invoice.items.length > 0) {
        itemsHtml = invoice.items.map(item => {
            const inclusiveTotal = item.price * item.quantity;
            const basePrice = calculateBasePrice(item.price, item.gst);
            const baseTotal = basePrice * item.quantity;
            const gstAmount = inclusiveTotal - baseTotal;
            
            return `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${baseTotal.toFixed(2)}</td>
                    <td>₹${gstAmount.toFixed(2)}</td>
                    <td>₹${inclusiveTotal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');
    }
    
    const modalHtml = `
        <div class="modal" id="invoiceModal" style="display: block;">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="closeInvoiceModal()">&times;</span>
                <h2>Invoice #${invoice.id}</h2>
                <div style="margin: 20px 0;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Customer Name:</strong> ${invoice.customer_name || '-'}</p>
                    <p><strong>Mobile:</strong> ${invoice.customer_mobile || '-'}</p>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>GST</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
                <div class="bill-summary" style="margin-top: 20px;">
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>₹${parseFloat(invoice.subtotal).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>CGST:</span>
                        <span>₹${parseFloat(invoice.cgst).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>SGST:</span>
                        <span>₹${parseFloat(invoice.sgst).toFixed(2)}</span>
                    </div>
                    ${invoice.discount > 0 ? `
                    <div class="summary-row">
                        <span>Discount:</span>
                        <span>-₹${parseFloat(invoice.discount).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>₹${parseFloat(invoice.total).toFixed(2)}</span>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-success" onclick="downloadPDF(${invoice.id})">Download PDF</button>
                    <button class="btn btn-danger" onclick="closeInvoiceModal()" style="margin-left: 10px;">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('invoiceModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Close invoice modal
function closeInvoiceModal() {
    const modal = document.getElementById('invoiceModal');
    if (modal) {
        modal.remove();
    }
}

// Calculate base price from inclusive price
function calculateBasePrice(inclusivePrice, gstRate) {
    return inclusivePrice * (100 - gstRate) / 100;
}

// Download PDF
function downloadPDF(invoiceId) {
    fetch(`/api/invoices/${invoiceId}`)
        .then(response => response.json())
        .then(invoice => {
            generatePDF(invoice, invoice.id);
        })
        .catch(error => {
            console.error('Error loading invoice:', error);
            alert('Error loading invoice. Please try again.');
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
    doc.text(`Date: ${new Date(invoiceData.created_at).toLocaleDateString('en-IN')}`, 20, 46);
    
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

// Send invoice via WhatsApp
function sendViaWhatsApp(invoiceId) {
    fetch(`/api/invoices/${invoiceId}`)
        .then(response => response.json())
        .then(invoice => {
            const message = formatInvoiceMessage(invoice, invoice.id);
            const mobile = invoice.customer_mobile.replace(/[^0-9]/g, '');
            
            if (!mobile) {
                alert('Mobile number not available for this invoice.');
                return;
            }
            
            const whatsappLink = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
            window.open(whatsappLink, '_blank');
        })
        .catch(error => {
            console.error('Error loading invoice:', error);
            alert('Error loading invoice. Please try again.');
        });
}

// Format invoice message for WhatsApp
function formatInvoiceMessage(invoiceData, invoiceId) {
    let message = `*Bombay Dyeing*\n`;
    message += `Bedding & Linen Shop\n\n`;
    message += `*Invoice #${invoiceId}*\n`;
    message += `Date: ${new Date(invoiceData.created_at).toLocaleDateString('en-IN')}\n\n`;
    
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('invoiceModal');
    if (event.target == modal) {
        closeInvoiceModal();
    }
}

