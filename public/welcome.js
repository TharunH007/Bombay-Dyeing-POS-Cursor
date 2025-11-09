let customers = [];

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

        customers = Array.from(customerMap.values());

        customers.sort((a, b) => new Date(b.lastPurchase) - new Date(a.lastPurchase));

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

    if (customers.length === 0) {
        container.style.display = 'none';
        emptyState.innerHTML = '<p style="font-size: 1.1em; opacity: 0.9;">No customers found. Create some invoices or quotations first.</p>';
        return;
    }

    emptyState.style.display = 'none';
    container.style.display = 'block';
    customerCount.textContent = customers.length;

    customerList.innerHTML = customers.map((customer, index) => `
        <div class="customer-item" onclick="sendWhatsApp('${customer.mobile}', '${customer.name.replace(/'/g, "\\'")}')">
            <div class="customer-info">
                <strong>${customer.name}</strong>
                <small>📱 ${customer.mobile} • Last: ${formatDate(customer.lastPurchase)}</small>
            </div>
            <span style="color: #25d366; font-size: 1.5em;">💬</span>
        </div>
    `).join('');

    updateMessagePreview();
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
    const checkboxes = document.querySelectorAll('.customer-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function clearSelection() {
    const checkboxes = document.querySelectorAll('.customer-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
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
