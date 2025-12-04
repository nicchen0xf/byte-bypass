// Check auth
checkAuth('admin');

let pricing = {};
let resellers = [];

// Load initial data
async function loadInitialData() {
    try {
        // Load pricing
        const pricingData = await apiCall(API.PRICING);
        pricing = pricingData.pricing;
        
        // Load resellers
        const resellersData = await apiCall(API.ADMIN_RESELLERS);
        resellers = resellersData.resellers;
        
        // Populate resellers dropdown
        const resellerSelect = document.getElementById('add_reseller');
        resellers.forEach(r => {
            const option = document.createElement('option');
            option.value = r.id;
            option.textContent = `${r.username} (Balance: $${r.balance.toFixed(2)})`;
            resellerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Update duration options based on reseller selection
function updateDurations() {
    const resellerSelect = document.getElementById('add_reseller');
    const durationSelect = document.getElementById('add_duration');
    const selectedValue = resellerSelect.value;
    
    durationSelect.innerHTML = '<option value="">Select Duration</option>';
    
    if (selectedValue === 'admin_free') {
        // Admin-Free durations
        const adminDurations = [
            { days: 1, label: '1 day - FREE' },
            { days: 7, label: '7 days - FREE' },
            { days: 30, label: '1 month (30 days) - FREE' },
            { days: 365, label: '1 year (365 days) - FREE' }
        ];
        
        adminDurations.forEach(d => {
            const option = document.createElement('option');
            option.value = d.days;
            option.textContent = d.label;
            option.style.color = '#10b981';
            option.style.fontWeight = 'bold';
            durationSelect.appendChild(option);
        });
    } else if (selectedValue) {
        // Regular pricing
        for (const [days, price] of Object.entries(pricing)) {
            const option = document.createElement('option');
            option.value = days;
            option.textContent = `$${price.toFixed(2)} - ${days == 365 ? 'Permanent' : days + ' days'}`;
            durationSelect.appendChild(option);
        }
    }
}

// Load whitelists
async function loadWhitelists() {
    const region = document.getElementById('filter-region').value;
    const status = document.getElementById('filter-status').value;
    
    try {
        const data = await apiCall(`${API.WHITELISTS}?region=${region}&status=${status}`);
        const tbody = document.getElementById('whitelists-body');
        
        if (data.whitelists.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">No whitelists found</td></tr>';
            return;
        }
        
        tbody.innerHTML = data.whitelists.map(w => `
            <tr>
                <td><code>${w.uid}</code></td>
                <td><span class="badge badge-primary">${w.region}</span></td>
                <td>${w.is_admin_free ? '<span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; font-weight: bold;">⭐ Admin-Free</span>' : w.seller}</td>
                <td data-expires="${w.expires_at}">${getTimeRemaining(w.expires_at)}</td>
                <td style="color: ${w.is_admin_free ? '#10b981' : '#f1f5f9'}; font-weight: bold;">
                    ${w.is_admin_free ? 'FREE' : '$' + w.cost.toFixed(2)}
                </td>
                <td>
                    ${!w.is_active ? '<span class="badge badge-danger">EXPIRED</span>' : 
                      w.is_paused ? '<span class="badge badge-warning">PAUSED</span>' : 
                      '<span class="badge badge-success">ACTIVE</span>'}
                </td>
                <td>${formatDate(w.expires_at)}</td>
                <td>
                    ${w.is_active ? `
                        <div class="btn-group">
                            <button class="btn btn-sm ${w.is_paused ? 'btn-success' : 'btn-warning'}" onclick="togglePause(${w.id})" title="${w.is_paused ? 'Resume' : 'Pause'}">
                                <i class="fas fa-${w.is_paused ? 'play' : 'pause'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="removeWhitelist(${w.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : '<span style="color: #64748b;">Expired</span>'}
                </td>
            </tr>
        `).join('');
        
        updateCountdowns();
    } catch (error) {
        console.error('Error loading whitelists:', error);
        showNotification('Failed to load whitelists', 'error');
    }
}

// Show add modal
function showAddModal() {
    document.getElementById('addModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('addForm').reset();
}

// Add whitelist form handler
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        uid: document.getElementById('add_uid').value.trim(),
        region: document.getElementById('add_region').value,
        duration: parseInt(document.getElementById('add_duration').value),
        reseller_id: document.getElementById('add_reseller').value
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    
    try {
        const data = await apiCall(API.WHITELISTS_ADD, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        showNotification(data.message, 'success');
        closeModal();
        loadWhitelists();
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add UID';
    }
});

// Toggle pause
async function togglePause(entryId) {
    try {
        const data = await apiCall(`${API.WHITELISTS}/${entryId}/pause`, {
            method: 'POST'
        });
        
        showNotification(data.message, 'success');
        loadWhitelists();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Remove whitelist
async function removeWhitelist(entryId) {
    if (!confirm('Are you sure you want to remove this UID? This action cannot be undone.')) {
        return;
    }
    
    try {
        const data = await apiCall(`${API.WHITELISTS}/${entryId}`, {
            method: 'DELETE'
        });
        
        showNotification(data.message, 'success');
        loadWhitelists();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize
loadInitialData();
loadWhitelists();

// Update countdowns every minute
setInterval(updateCountdowns, 60000);
