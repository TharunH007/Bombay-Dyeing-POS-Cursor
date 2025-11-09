// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    
    // Handle form submission
    document.getElementById('addItemForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addItem();
    });
    
    // Handle edit form submission
    document.getElementById('editItemForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateItem();
    });
});

// Load all items
function loadItems(search = '') {
    const url = search ? `/api/items?search=${encodeURIComponent(search)}` : '/api/items';
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            displayItems(data);
        })
        .catch(error => {
            console.error('Error loading items:', error);
            alert('Error loading items. Please try again.');
        });
}

// Display items in table
function displayItems(items) {
    const tbody = document.getElementById('itemsTableBody');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No items found</td></tr>';
        return;
    }

    items.forEach(item => {
        const row = document.createElement('tr');
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-primary';
        editBtn.style.marginRight = '5px';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editItem(item.id, item.name, item.gst, item.mrp, item.discount, item.price);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeItem(item.id);
        
        const actionsCell = document.createElement('td');
        actionsCell.appendChild(editBtn);
        actionsCell.appendChild(removeBtn);
        
        const mrp = item.mrp || item.price;
        const discount = item.discount || 0;
        
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>₹${parseFloat(mrp).toFixed(2)}</td>
            <td>${discount > 0 ? discount + '%' : '-'}</td>
            <td>₹${parseFloat(item.price).toFixed(2)}</td>
            <td>${item.gst}%</td>
        `;
        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}

// Calculate item price
function calculateItemPrice() {
    const mrp = parseFloat(document.getElementById('itemMRP').value) || 0;
    const discount = parseFloat(document.getElementById('itemDiscount').value) || 0;
    const price = mrp * (1 - discount / 100);
    document.getElementById('itemPrice').value = price > 0 ? price.toFixed(2) : '';
}

// Calculate edit item price
function calculateEditItemPrice() {
    const mrp = parseFloat(document.getElementById('editItemMRP').value) || 0;
    const discount = parseFloat(document.getElementById('editItemDiscount').value) || 0;
    const price = mrp * (1 - discount / 100);
    document.getElementById('editItemPrice').value = price > 0 ? price.toFixed(2) : '';
}

// Add new item
function addItem() {
    const name = document.getElementById('itemName').value.trim();
    const gst = parseFloat(document.getElementById('itemGST').value);
    const mrp = parseFloat(document.getElementById('itemMRP').value);
    const discount = parseFloat(document.getElementById('itemDiscount').value) || 0;

    if (!name || isNaN(gst) || isNaN(mrp)) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    fetch('/api/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, gst, mrp, discount: discount > 0 ? discount : null })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            // Clear form
            document.getElementById('addItemForm').reset();
            // Reload items
            loadItems();
            alert('Item added successfully!');
        }
    })
    .catch(error => {
        console.error('Error adding item:', error);
        alert('Error adding item. Please try again.');
    });
}

// Remove item
function removeItem(id) {
    if (!confirm('Are you sure you want to remove this item?')) {
        return;
    }

    fetch(`/api/items/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            loadItems();
            alert('Item removed successfully!');
        }
    })
    .catch(error => {
        console.error('Error removing item:', error);
        alert('Error removing item. Please try again.');
    });
}

// Search items
function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    loadItems(searchTerm);
}

// Edit item - open modal
function editItem(id, name, gst, mrp, discount, price) {
    document.getElementById('editItemId').value = id;
    document.getElementById('editItemName').value = name;
    document.getElementById('editItemGST').value = gst;
    document.getElementById('editItemMRP').value = mrp || price;
    document.getElementById('editItemDiscount').value = discount || '';
    document.getElementById('editItemPrice').value = price;
    document.getElementById('editModal').style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editItemForm').reset();
}

// Update item
function updateItem() {
    const id = document.getElementById('editItemId').value;
    const name = document.getElementById('editItemName').value.trim();
    const gst = parseFloat(document.getElementById('editItemGST').value);
    const mrp = parseFloat(document.getElementById('editItemMRP').value);
    const discount = parseFloat(document.getElementById('editItemDiscount').value) || 0;

    if (!name || isNaN(gst) || isNaN(mrp)) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, gst, mrp, discount: discount > 0 ? discount : null })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('Error: ' + data.error);
        } else {
            closeEditModal();
            loadItems();
            alert('Item updated successfully!');
        }
    })
    .catch(error => {
        console.error('Error updating item:', error);
        alert('Error updating item. Please try again.');
    });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeEditModal();
    }
}

