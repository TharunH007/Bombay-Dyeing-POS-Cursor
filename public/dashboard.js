let monthlyChart = null;
let yearlyChart = null;
let monthlyFilter = 1;
let yearlyFilter = 1;

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

// Load all dashboard data
function loadDashboardData() {
    Promise.all([
        fetch('/api/dashboard/monthly-total').then(r => r.json()),
        fetch(`/api/dashboard/monthly-sales?months=${monthlyFilter}`).then(r => r.json()),
        fetch(`/api/dashboard/yearly-sales?years=${yearlyFilter}`).then(r => r.json()),
        fetch('/api/dashboard/top-items').then(r => r.json())
    ])
    .then(([monthlyTotal, monthlySales, yearlySales, topItems]) => {
        displayMonthlyTotal(monthlyTotal);
        createMonthlyChart(monthlySales);
        createYearlyChart(yearlySales);
        displayTopItems(topItems);
    })
    .catch(error => {
        console.error('Error loading dashboard data:', error);
        alert('Error loading dashboard data. Please try again.');
    });
}

// Set monthly filter
function setMonthlyFilter(months) {
    monthlyFilter = months;
    
    // Update active button state - find the parent filter-buttons div and update its buttons
    const monthlySection = document.querySelector('#monthlyChart').closest('div');
    const filterButtons = monthlySection.querySelector('.filter-buttons');
    filterButtons.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Refresh monthly chart
    fetch(`/api/dashboard/monthly-sales?months=${months}`)
        .then(r => r.json())
        .then(data => createMonthlyChart(data))
        .catch(error => {
            console.error('Error loading monthly sales:', error);
            alert('Error loading monthly sales. Please try again.');
        });
}

// Set yearly filter
function setYearlyFilter(years) {
    yearlyFilter = years;
    
    // Update active button state - find the parent filter-buttons div and update its buttons
    const yearlySection = document.querySelector('#yearlyChart').closest('div');
    const filterButtons = yearlySection.querySelector('.filter-buttons');
    filterButtons.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Refresh yearly chart
    fetch(`/api/dashboard/yearly-sales?years=${years}`)
        .then(r => r.json())
        .then(data => createYearlyChart(data))
        .catch(error => {
            console.error('Error loading yearly sales:', error);
            alert('Error loading yearly sales. Please try again.');
        });
}

// Display monthly total
function displayMonthlyTotal(data) {
    document.getElementById('monthlyTotal').textContent = `₹${parseFloat(data.total || 0).toFixed(2)}`;
}

// Create monthly sales chart
function createMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (monthlyChart) {
        monthlyChart.destroy();
    }

    const labels = data.map(item => item.month);
    const totals = data.map(item => parseFloat(item.total || 0));

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Sales (₹)',
                data: totals,
                backgroundColor: 'rgba(74, 158, 255, 0.6)',
                borderColor: '#4a9eff',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Create yearly sales chart
function createYearlyChart(data) {
    const ctx = document.getElementById('yearlyChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (yearlyChart) {
        yearlyChart.destroy();
    }

    const labels = data.map(item => item.year);
    const totals = data.map(item => parseFloat(item.total || 0));

    yearlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Yearly Sales (₹)',
                data: totals,
                backgroundColor: 'rgba(74, 158, 255, 0.1)',
                borderColor: '#4a9eff',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4a9eff',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#666',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: '#666'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Display top items
function displayTopItems(items) {
    const tbody = document.getElementById('topItemsTableBody');
    tbody.innerHTML = '';

    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No sales data available</td></tr>';
        return;
    }

    items.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.name}</td>
            <td>${item.totalQuantity}</td>
            <td>₹${parseFloat(item.totalRevenue).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Check backup status
function checkBackupStatus() {
    fetch('/api/backup/status')
        .then(r => r.json())
        .then(data => {
            const statusDiv = document.getElementById('backupStatus');
            if (data.configured) {
                let message = `<span style="color: #27ae60;">✓ Local backup system ready</span>`;
                if (data.latestBackup) {
                    const backupDate = new Date(data.latestBackup.timestamp).toLocaleString('en-IN');
                    message += `<br><small style="color: #b0b0b0;">Last backup: ${backupDate}</small>`;
                } else {
                    message += `<br><small style="color: #b0b0b0;">No backups yet. Click "Backup Now" to create one.</small>`;
                }
                statusDiv.innerHTML = message;
            } else {
                statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ ${data.message}</span>`;
            }
        })
        .catch(error => {
            console.error('Error checking backup status:', error);
        });
}

// Trigger manual backup
function triggerManualBackup() {
    const statusDiv = document.getElementById('backupStatus');
    statusDiv.innerHTML = `<span style="color: #4a9eff;">⏳ Backing up data...</span>`;
    
    fetch('/api/backup/manual', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) {
            statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ ${data.message || data.error}</span>`;
            alert('Backup failed: ' + (data.message || data.error));
        } else {
            statusDiv.innerHTML = `<span style="color: #27ae60;">✓ Backup completed at ${new Date(data.timestamp).toLocaleString('en-IN')}</span>`;
            alert('Backup completed successfully!');
        }
    })
    .catch(error => {
        console.error('Error during backup:', error);
        statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ Backup failed</span>`;
        alert('Error during backup. Please try again.');
    });
}

// Show restore modal
function showRestoreModal() {
    const statusDiv = document.getElementById('backupStatus');
    statusDiv.innerHTML = `<span style="color: #4a9eff;">⏳ Loading available backups...</span>`;
    
    fetch('/api/backup/list')
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ ${data.message || data.error}</span>`;
                alert('Failed to load backups: ' + (data.message || data.error));
                return;
            }
            
            if (data.length === 0) {
                statusDiv.innerHTML = `<span style="color: #888;">No backups available</span>`;
                alert('No backups available to restore from.');
                return;
            }
            
            let optionsHtml = data.map(backup => {
                const date = new Date(backup.timestamp).toLocaleString('en-IN');
                return `<option value="${backup.filename}">${date}</option>`;
            }).join('');
            
            const modalHtml = `
                <div class="modal" id="restoreModal" style="display: block;">
                    <div class="modal-content" style="max-width: 500px;">
                        <span class="close" onclick="closeRestoreModal()">&times;</span>
                        <h2>Restore from Backup</h2>
                        <p style="color: #e74c3c; margin: 15px 0;"><strong>Warning:</strong> Restoring will replace all current data!</p>
                        <div style="margin: 20px 0;">
                            <label for="backupSelect" style="display: block; margin-bottom: 8px;">Select a backup:</label>
                            <select id="backupSelect" style="width: 100%; padding: 10px; background: #2a2a2a; color: #e0e0e0; border: 1px solid #444; border-radius: 6px;">
                                ${optionsHtml}
                            </select>
                        </div>
                        <div style="margin-top: 20px; text-align: center;">
                            <button class="btn btn-success" onclick="performRestore()">Restore Selected Backup</button>
                            <button class="btn btn-danger" onclick="closeRestoreModal()" style="margin-left: 10px;">Cancel</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            statusDiv.innerHTML = `<span style="color: #4a9eff;">Select a backup to restore</span>`;
        })
        .catch(error => {
            console.error('Error loading backups:', error);
            statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ Failed to load backups</span>`;
            alert('Error loading backups. Please try again.');
        });
}

// Close restore modal
function closeRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (modal) {
        modal.remove();
    }
    checkBackupStatus();
}

// Perform restore
function performRestore() {
    const filename = document.getElementById('backupSelect').value;
    
    if (!confirm('Are you sure you want to restore this backup? This will replace ALL current data!')) {
        return;
    }
    
    const statusDiv = document.getElementById('backupStatus');
    statusDiv.innerHTML = `<span style="color: #4a9eff;">⏳ Restoring data...</span>`;
    closeRestoreModal();
    
    fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filename })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) {
            statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ Restore failed</span>`;
            alert('Restore failed: ' + data.error);
        } else {
            statusDiv.innerHTML = `<span style="color: #27ae60;">✓ Restore completed successfully</span>`;
            alert('Data restored successfully! Refreshing dashboard...');
            loadDashboardData();
        }
    })
    .catch(error => {
        console.error('Error during restore:', error);
        statusDiv.innerHTML = `<span style="color: #e74c3c;">⚠ Restore failed</span>`;
        alert('Error during restore. Please try again.');
    });
}

// Download monthly sales report
function downloadMonthlySalesReport() {
    fetch('/api/dashboard/monthly-report')
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('Error generating report: ' + data.error);
                return;
            }
            
            // Create CSV content
            let csv = `Monthly Sales Report - ${data.month}\n\n`;
            csv += `Summary\n`;
            csv += `Total Invoices,${data.summary.totalInvoices}\n`;
            csv += `Total Sales,₹${data.summary.totalSales}\n`;
            csv += `Total CGST,₹${data.summary.totalCGST}\n`;
            csv += `Total SGST,₹${data.summary.totalSGST}\n`;
            csv += `Total GST,₹${data.summary.totalGST}\n`;
            csv += `Total Discount,₹${data.summary.totalDiscount}\n`;
            csv += `\n\n`;
            
            // Add invoice details
            csv += `Invoice Details\n`;
            csv += `Invoice ID,Date,Customer Name,Mobile,Subtotal,CGST,SGST,Discount,Total\n`;
            
            data.invoices.forEach(invoice => {
                csv += `${invoice.invoiceId},${invoice.date},${invoice.customerName},${invoice.customerMobile},`;
                csv += `₹${invoice.subtotal.toFixed(2)},₹${invoice.cgst.toFixed(2)},₹${invoice.sgst.toFixed(2)},`;
                csv += `₹${invoice.discount.toFixed(2)},₹${invoice.total.toFixed(2)}\n`;
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const filename = `Monthly_Sales_Report_${data.month.replace(' ', '_')}.csv`;
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(error => {
            console.error('Error downloading report:', error);
            alert('Error downloading report. Please try again.');
        });
}

// Check backup status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkBackupStatus();
});

