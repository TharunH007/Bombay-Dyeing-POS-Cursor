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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('quotationModal');
    if (event.target == modal) {
        closeQuotationModal();
    }
}

