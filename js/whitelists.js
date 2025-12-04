// Initialize page
initPage();

let pricing = {};
let resellers = [];

// Load pricing and resellers
async function loadInitialData() {
    try {
        const data = await apiCall(API.PRICING);
        pricing = data.pricing;
        
        const user = Storage.getUser();
        if (user.role === 'admin') {
            const resellersData = await apiCall(API.ADMIN_RESELLERS);
            resellers = resellersData.resellers;
            document.getElementById('reseller-group').style.display = 'block';
            
            // Populate resellers dropdown
            const resellerSelect = document.getElementById('add_reseller');
            resellersData.resellers.forEach(r => {
                const option = document.createElement('option');
                option.value = r.id;
                option.textContent = `${r.username} (Balance: $${r.balance.toFixed(2)})`;
                resellerSelect.appendChild(option);
            });
        }
        
        // Set default durations for resellers
        updateDurations();
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
}

// Update duration options based on selection
function updateDurations() {
    const user = Storage.getUser();
    const durationSelect = document.getElementById('add_duration');
    const resellerSelect = document.getElementById('add_reseller');
    
    durationSelect.innerHTML = '<option value="">Select Duration</option>';
    
    if (user.role === 'admin' && resellerSelect.value === 'admin_free') {
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
    } else {
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
                <td><span class="badge badge-success">${w.region}</span></td>
                <td>${w.is_admin_free ? '<span class="badge badge-admin-free">⭐ Admin-Free</span>' : w.seller}</td>
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
                        <div class="action-buttons">
                            <button class="action-btn ${w.is_paused ? 'action-resume' : 'action-pause'}" 
                                    onclick="togglePause(${w.id})">
                                <i class="fas fa-${w.is_paused ? 'play' : 'pause'}"></i>
                                ${w.is_paused ? 'Resume' : 'Pause'}
                            </button>
                            <button class="action-btn action-delete" onclick="removeWhitelist(${w.id})">
                                <i class="fas fa-trash"></i> Delete
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
        duration: parseInt(document.getElementById('add_duration').value)
    };
    
    const user = Storage.getUser();
    if (user.role === 'admin') {
        const resellerValue = document.getElementById('add_reseller').value;
        formData.reseller_id = resellerValue || null;
    }
    
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
        
        // Update balance in navbar
        if (data.new_balance !== undefined) {
            const user = Storage.getUser();
            user.balance = data.new_balance;
            Storage.setUser(user);
            document.getElementById('balance-display').textContent = `$${data.new_balance.toFixed(2)}`;
        }
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

// Initialize
loadInitialData();
loadWhitelists();
