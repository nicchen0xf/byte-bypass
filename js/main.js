// ByteForce - UID Management System - Main JavaScript

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});

// Confirm before form submission for dangerous actions
document.querySelectorAll('form[data-confirm]').forEach(form => {
    form.addEventListener('submit', function(e) {
        const message = form.getAttribute('data-confirm');
        if (!confirm(message)) {
            e.preventDefault();
        }
    });
});

// Format currency
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

// Show loading state on buttons
function setButtonLoading(button, loading = true) {
    if (loading) {
        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText;
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastHtml = 
        <div class="toast align-items-center text-white bg- border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    ;
    
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHtml;
    document.getElementById('toastContainer').appendChild(toastElement.firstElementChild);
    
    const toast = new bootstrap.Toast(toastElement.firstElementChild);
    toast.show();
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'danger');
    });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Validate UID format
function validateUID(uid) {
    return /^[0-9]+$/.test(uid);
}

// Check if date is expired
function isExpired(dateString) {
    const expiryDate = new Date(dateString);
    const now = new Date();
    return expiryDate < now;
}

// Update balance display
function updateBalanceDisplay() {
    fetch('/api/check-balance')
        .then(response => response.json())
        .then(data => {
            const balanceElements = document.querySelectorAll('[data-balance]');
            balanceElements.forEach(element => {
                element.textContent = formatCurrency(data.balance);
            });
        })
        .catch(error => {
            console.error('Error updating balance:', error);
        });
}

// Refresh stats
function refreshStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            Object.keys(data).forEach(key => {
                const element = document.querySelector([data-stat=""]);
                if (element) {
                    element.textContent = data[key];
                }
            });
        })
        .catch(error => {
            console.error('Error refreshing stats:', error);
        });
}

// Auto-refresh stats every 30 seconds
if (document.querySelector('[data-stat]')) {
    setInterval(refreshStats, 30000);
}

// Table search functionality
function initTableSearch(tableId, searchInputId) {
    const searchInput = document.getElementById(searchInputId);
    const table = document.getElementById(tableId);
    
    if (searchInput && table) {
        searchInput.addEventListener('keyup', function() {
            const filter = searchInput.value.toUpperCase();
            const rows = table.getElementsByTagName('tr');
            
            for (let i = 1; i < rows.length; i++) {
                let txtValue = rows[i].textContent || rows[i].innerText;
                if (txtValue.toUpperCase().indexOf(filter) > -1) {
                    rows[i].style.display = '';
                } else {
                    rows[i].style.display = 'none';
                }
            }
        });
    }
}

// Confirm delete action
function confirmDelete(itemName) {
    return confirm(Are you sure you want to delete ? This action cannot be undone.);
}

// Handle AJAX form submissions
function handleAjaxForm(formId, successCallback) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            
            setButtonLoading(submitButton, true);
            
            fetch(form.action, {
                method: form.method,
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                setButtonLoading(submitButton, false);
                
                if (data.success) {
                    showToast(data.message, 'success');
                    if (successCallback) {
                        successCallback(data);
                    }
                } else {
                    showToast(data.message, 'danger');
                }
            })
            .catch(error => {
                setButtonLoading(submitButton, false);
                showToast('An error occurred. Please try again.', 'danger');
                console.error('Error:', error);
            });
        });
    }
}

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// Initialize popovers
document.addEventListener('DOMContentLoaded', function() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function(popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

// Countdown timer for expiry dates
function startCountdown(elementId, expiryDate) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    function updateCountdown() {
        const now = new Date().getTime();
        const expiry = new Date(expiryDate).getTime();
        const distance = expiry - now;
        
        if (distance < 0) {
            element.innerHTML = 'EXPIRED';
            element.classList.add('text-danger');
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        
        element.innerHTML = ${days}d h m;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 60000); // Update every minute
}

// Export table to CSV
function exportTableToCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let row of rows) {
        let rowData = [];
        const cols = row.querySelectorAll('td, th');
        
        for (let col of cols) {
            rowData.push(col.innerText);
        }
        
        csv.push(rowData.join(','));
    }
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Log user activity (for analytics)
function logActivity(action, details = {}) {
    // This can be extended to send analytics to a backend service
    console.log('Activity:', action, details);
}
