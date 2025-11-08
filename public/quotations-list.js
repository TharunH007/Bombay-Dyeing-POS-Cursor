let allQuotations = [];

// Load quotations on page load
document.addEventListener('DOMContentLoaded', () => {
    loadQuotations();
});

// Load all quotations
function loadQuotations() {
    fetch('/api/quotations')
        .then(response => response.json())
        .then(data => {
            allQuotations = data;
            displayQuotations(data);
        })
        .catch(error => {
            console.error('Error loading quotations:', error);
            alert('Error loading quotations. Please try again.');
        });
}

// Display quotations in table
function displayQuotations(quotations) {
    const tbody = document.getElementById('quotationsTableBody');
    tbody.innerHTML = '';

    if (quotations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No quotations found</td></tr>';
        return;
    }

    quotations.forEach(quotation => {
        const date = new Date(quotation.created_at).toLocaleDateString('en-IN');
        const itemsCount = quotation.items ? quotation.items.length : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${quotation.id}</td>
            <td>${date}</td>
            <td>${quotation.customer_name || '-'}</td>
            <td>${quotation.customer_mobile || '-'}</td>
            <td>${itemsCount} item(s)</td>
            <td>₹${parseFloat(quotation.total).toFixed(2)}</td>
            <td>
                <button class="btn btn-primary" style="margin-right: 5px;" onclick="viewQuotation(${quotation.id})">View</button>
                <button class="btn btn-success" style="margin-right: 5px;" onclick="convertToInvoice(${quotation.id})">Convert to Invoice</button>
                <button class="btn btn-danger" onclick="deleteQuotation(${quotation.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Search quotations
function searchQuotations() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayQuotations(allQuotations);
        return;
    }
    
    const filtered = allQuotations.filter(quotation => {
        const name = (quotation.customer_name || '').toLowerCase();
        const mobile = (quotation.customer_mobile || '').toLowerCase();
        return name.includes(searchTerm) || mobile.includes(searchTerm);
    });
    
    displayQuotations(filtered);
}

// View quotation details
function viewQuotation(id) {
    fetch(`/api/quotations/${id}`)
        .then(response => response.json())
        .then(quotation => {
            showQuotationModal(quotation);
        })
        .catch(error => {
            console.error('Error loading quotation:', error);
            alert('Error loading quotation. Please try again.');
        });
}

// Show quotation modal
function showQuotationModal(quotation) {
    const date = new Date(quotation.created_at).toLocaleDateString('en-IN');
    let itemsHtml = '';
    
    if (quotation.items && quotation.items.length > 0) {
        itemsHtml = quotation.items.map(item => {
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
        <div class="modal" id="quotationModal" style="display: block;">
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="closeQuotationModal()">&times;</span>
                <h2>Quotation #${quotation.id}</h2>
                <div style="margin: 20px 0;">
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Customer Name:</strong> ${quotation.customer_name || '-'}</p>
                    <p><strong>Mobile:</strong> ${quotation.customer_mobile || '-'}</p>
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
                        <span>₹${parseFloat(quotation.subtotal).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>CGST:</span>
                        <span>₹${parseFloat(quotation.cgst).toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                        <span>SGST:</span>
                        <span>₹${parseFloat(quotation.sgst).toFixed(2)}</span>
                    </div>
                    ${quotation.discount > 0 ? `
                    <div class="summary-row">
                        <span>Discount:</span>
                        <span>-₹${parseFloat(quotation.discount).toFixed(2)}</span>
                    </div>
                    ` : ''}
                    <div class="summary-row total">
                        <span>Total:</span>
                        <span>₹${parseFloat(quotation.total).toFixed(2)}</span>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-primary" onclick="downloadQuotationPDF(${quotation.id})" style="margin-right: 10px;">Download PDF</button>
                    <button class="btn btn-success" onclick="convertToInvoice(${quotation.id})">Convert to Invoice</button>
                    <button class="btn btn-danger" onclick="closeQuotationModal()" style="margin-left: 10px;">Close</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('quotationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Close quotation modal
function closeQuotationModal() {
    const modal = document.getElementById('quotationModal');
    if (modal) {
        modal.remove();
    }
}

// Calculate base price from inclusive price
function calculateBasePrice(inclusivePrice, gstRate) {
    return inclusivePrice * (100 - gstRate) / 100;
}

// Convert quotation to invoice
function convertToInvoice(id) {
    if (!confirm('Convert this quotation to an invoice? The quotation will be deleted after conversion.')) {
        return;
    }

    fetch(`/api/quotations/${id}/convert`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deleteQuotation: true })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            closeQuotationModal();
            loadQuotations();
            alert('Quotation converted to invoice successfully! Invoice #' + data.id);
            // Optionally redirect to invoices page
            // window.location.href = '/invoices';
        }
    })
    .catch(error => {
        console.error('Error converting quotation:', error);
        alert('Error converting quotation. Please try again.');
    });
}

// Delete quotation
function deleteQuotation(id) {
    if (!confirm('Are you sure you want to delete this quotation?')) {
        return;
    }

    fetch(`/api/quotations/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            loadQuotations();
            alert('Quotation deleted successfully!');
        }
    })
    .catch(error => {
        console.error('Error deleting quotation:', error);
        alert('Error deleting quotation. Please try again.');
    });
}

// Download quotation PDF
function downloadQuotationPDF(id) {
    fetch(`/api/quotations/${id}`)
        .then(response => response.json())
        .then(quotation => {
            generateQuotationPDF(quotation, quotation.id);
        })
        .catch(error => {
            console.error('Error loading quotation for PDF:', error);
            alert('Error generating PDF. Please try again.');
        });
}

// Generate Quotation PDF
function generateQuotationPDF(quotationData, quotationId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Bombay Dyeing', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Bedding & Linen Shop', 105, 28, { align: 'center' });

    // Quotation Details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('QUOTATION', 105, 40, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Quotation #: ${quotationId}`, 20, 50);
    doc.text(`Date: ${new Date(quotationData.created_at).toLocaleDateString('en-IN')}`, 20, 56);
    
    if (quotationData.customer_name) {
        doc.text(`Customer: ${quotationData.customer_name}`, 20, 62);
    }
    if (quotationData.customer_mobile) {
        doc.text(`Mobile: ${quotationData.customer_mobile}`, 20, 68);
    }
    if (quotationData.customer_gst) {
        doc.text(`GST No: ${quotationData.customer_gst}`, 20, 74);
    }

    // Items Table
    let yPos = quotationData.customer_gst ? 86 : 80;
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

    quotationData.items.forEach(item => {
        const inclusiveTotal = item.price * item.quantity;
        const basePrice = calculateBasePrice(item.price, item.gst);
        const baseTotal = basePrice * item.quantity;
        const gstAmount = inclusiveTotal - baseTotal;

        doc.text(item.name.substring(0, 25), 20, yPos);
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

    doc.text(`Subtotal: ₹${quotationData.subtotal.toFixed(2)}`, 130, yPos);
    yPos += 7;
    doc.text(`CGST: ₹${quotationData.cgst.toFixed(2)}`, 130, yPos);
    yPos += 7;
    doc.text(`SGST: ₹${quotationData.sgst.toFixed(2)}`, 130, yPos);
    yPos += 7;
    
    if (quotationData.discount > 0) {
        doc.text(`Discount: -₹${quotationData.discount.toFixed(2)}`, 130, yPos);
        yPos += 7;
    }

    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text(`Total: ₹${quotationData.total.toFixed(2)}`, 130, yPos);

    // Footer
    yPos = 280;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('This is a quotation and not a tax invoice.', 105, yPos, { align: 'center' });
    yPos += 4;
    doc.text('Thank you for your business!', 105, yPos, { align: 'center' });

    // Save PDF
    const fileName = `Bombay_Dyeing_Quotation_${quotationId}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('quotationModal');
    if (event.target == modal) {
        closeQuotationModal();
    }
}

