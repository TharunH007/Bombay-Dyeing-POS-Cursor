let monthlyChart = null;
let yearlyChart = null;

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
});

// Load all dashboard data
function loadDashboardData() {
    Promise.all([
        fetch('/api/dashboard/monthly-total').then(r => r.json()),
        fetch('/api/dashboard/monthly-sales').then(r => r.json()),
        fetch('/api/dashboard/yearly-sales').then(r => r.json()),
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
                        color: '#b0b0b0',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: '#333'
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
                        color: '#b0b0b0',
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    },
                    grid: {
                        color: '#333'
                    }
                },
                x: {
                    ticks: {
                        color: '#b0b0b0'
                    },
                    grid: {
                        color: '#333'
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

