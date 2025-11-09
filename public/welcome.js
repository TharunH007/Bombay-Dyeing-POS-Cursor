let customers = [];
let allCustomers = [];

function normalizeMobile(mobile) {
    if (!mobile) return null;
    
    let cleanMobile = mobile.trim().replace(/\D/g, '');
    
    cleanMobile = cleanMobile.replace(/^0+/, '');
    
    if (cleanMobile.startsWith('91') && cleanMobile.length > 10) {
        cleanMobile = cleanMobile.substring(2);
    }
    
    cleanMobile = cleanMobile.replace(/^0+/, '');
    
    if (cleanMobile.length === 10) {
        return cleanMobile;
    }
    
    return null;
}

async function loadCustomers() {
    try {
        const [invoicesRes, quotationsRes] = await Promise.all([
            fetch('/api/invoices'),
            fetch('/api/quotations')
        ]);

        const invoices = await invoicesRes.json();
        const quotations = await quotationsRes.json();

        const customerMap = new Map();

        invoices.forEach(invoice => {
            if (invoice.customer_mobile && invoice.customer_mobile.trim()) {
                const normalizedMobile = normalizeMobile(invoice.customer_mobile);
                const displayMobile = invoice.customer_mobile.trim();
                const name = invoice.customer_name || 'Unknown';
                
                if (normalizedMobile) {
                    if (!customerMap.has(normalizedMobile)) {
                        customerMap.set(normalizedMobile, {
                            name: name,
                            mobile: displayMobile,
                            normalizedMobile: normalizedMobile,
                            lastPurchase: invoice.created_at
                        });
                    } else {
                        const existing = customerMap.get(normalizedMobile);
                        if (new Date(invoice.created_at) > new Date(existing.lastPurchase)) {
                            existing.lastPurchase = invoice.created_at;
                            existing.name = name;
                            existing.mobile = displayMobile;
                        }
                    }
                }
            }
        });

        quotations.forEach(quotation => {
            if (quotation.customer_mobile && quotation.customer_mobile.trim()) {
                const normalizedMobile = normalizeMobile(quotation.customer_mobile);
                const displayMobile = quotation.customer_mobile.trim();
                const name = quotation.customer_name || 'Unknown';
                
                if (normalizedMobile) {
                    if (!customerMap.has(normalizedMobile)) {
                        customerMap.set(normalizedMobile, {
                            name: name,
                            mobile: displayMobile,
                            normalizedMobile: normalizedMobile,
                            lastPurchase: quotation.created_at
                        });
                    } else {
                        const existing = customerMap.get(normalizedMobile);
                        if (new Date(quotation.created_at) > new Date(existing.lastPurchase)) {
                            existing.lastPurchase = quotation.created_at;
                            existing.name = name;
                            existing.mobile = displayMobile;
                        }
                    }
                }
            }
        });

        allCustomers = Array.from(customerMap.values());
        allCustomers.sort((a, b) => new Date(b.lastPurchase) - new Date(a.lastPurchase));
        
        customers = [...allCustomers];

        displayCustomers();
        
    } catch (error) {
        console.error('Error loading customers:', error);
        alert('Failed to load customers. Please try again.');
    }
}

function displayCustomers() {
    const container = document.getElementById('customerListContainer');
    const emptyState = document.getElementById('emptyState');
    const customerList = document.getElementById('customerList');
    const customerCount = document.getElementById('customerCount');
    const selectedCount = document.getElementById('selectedCount');

    if (customers.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        
        if (allCustomers.length === 0) {
            emptyState.innerHTML = '<p style="font-size: 1.1em; color: #718096;">No customers found. Create some invoices or quotations first.</p>';
        } else {
            emptyState.innerHTML = '<p style="font-size: 1.1em; color: #718096;">No customers match your search. Try a different keyword.</p>';
        }
        return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'block';
    customerCount.textContent = customers.length;
    if (selectedCount) {
        selectedCount.textContent = '0';
    }

    customerList.innerHTML = customers.map((customer, index) => `
        <div class="customer-item">
            <input type="checkbox" id="customer-${index}" class="customer-checkbox" onchange="updateSelectedCount()">
            <div class="customer-info" onclick="sendWhatsApp('${customer.mobile}', '${customer.name.replace(/'/g, "\\'")}')">
                <strong>${customer.name}</strong>
                <small>📱 ${customer.mobile} • Last: ${formatDate(customer.lastPurchase)}</small>
            </div>
            <span style="color: #25d366; font-size: 1.5em;" onclick="sendWhatsApp('${customer.mobile}', '${customer.name.replace(/'/g, "\\'")}')">💬</span>
        </div>
    `).join('');

    if (!window.messagePreviewInitialized) {
        updateMessagePreview();
        window.messagePreviewInitialized = true;
    }
    updateSelectedCount();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

function sendWhatsApp(mobile, name) {
    const message = document.getElementById('promoMessage').value.trim();
    
    if (!message) {
        alert('Please enter a promotional message first!');
        return;
    }

    const normalizedMobile = normalizeMobile(mobile);
    
    if (!normalizedMobile) {
        alert(`Invalid mobile number format: ${mobile}`);
        return;
    }

    const whatsappMobile = '91' + normalizedMobile;

    const personalizedMessage = `Hi ${name}! ${message}`;
    const encodedMessage = encodeURIComponent(personalizedMessage);
    const whatsappUrl = `https://wa.me/${whatsappMobile}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}

function selectAllCustomers() {
    const checkboxes = document.querySelectorAll('.customer-checkbox');
    checkboxes.forEach(cb => cb.checked = true);
    updateSelectedCount();
}

function clearSelection() {
    const checkboxes = document.querySelectorAll('.customer-checkbox');
    checkboxes.forEach(cb => cb.checked = false);
    updateSelectedCount();
}

function updateSelectedCount() {
    const checkboxes = document.querySelectorAll('.customer-checkbox:checked');
    const selectedCount = document.getElementById('selectedCount');
    if (selectedCount) {
        selectedCount.textContent = checkboxes.length;
    }
}

function sendToSelected() {
    const message = document.getElementById('promoMessage').value.trim();
    
    if (!message) {
        alert('Please enter a promotional message first!');
        return;
    }

    const checkboxes = document.querySelectorAll('.customer-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one customer!');
        return;
    }

    let sentCount = 0;
    checkboxes.forEach((checkbox, index) => {
        const customerIndex = parseInt(checkbox.id.replace('customer-', ''));
        const customer = customers[customerIndex];
        
        if (customer) {
            setTimeout(() => {
                sendWhatsApp(customer.mobile, customer.name);
            }, index * 1000);
            sentCount++;
        }
    });

    alert(`Opening WhatsApp for ${sentCount} customers. Each will open in a new tab with a 1-second delay.`);
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch').value.toLowerCase().trim();
    
    if (!searchTerm) {
        customers = [...allCustomers];
    } else {
        customers = allCustomers.filter(customer => {
            const nameMatch = customer.name.toLowerCase().includes(searchTerm);
            const mobileMatch = customer.mobile.includes(searchTerm);
            return nameMatch || mobileMatch;
        });
    }
    
    displayCustomers();
}

function updateMessagePreview() {
    const messageInput = document.getElementById('promoMessage');
    const preview = document.getElementById('messagePreview');
    const previewText = document.getElementById('previewText');
    
    messageInput.addEventListener('input', () => {
        const message = messageInput.value.trim();
        if (message && customers.length > 0) {
            preview.style.display = 'block';
            const sampleName = customers[0]?.name || 'Customer';
            previewText.textContent = `Hi ${sampleName}! ${message}`;
        } else {
            preview.style.display = 'none';
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    updateMessagePreview();
});
