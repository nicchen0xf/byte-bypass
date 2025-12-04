// Initialize dashboard
initPage();

async function loadDashboardStats() {
    try {
        const data = await apiCall(API.DASHBOARD_STATS);
        const user = Storage.getUser();
        
        const statsContainer = document.getElementById('stats-container');
        
        if (user.role === 'admin') {
            // Admin stats
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-value">${data.stats.total_resellers}</div>
                    <div class="stat-label">Total Resellers</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-icon"><i class="fas fa-list"></i></div>
                    <div class="stat-value">${data.stats.total_uids}</div>
                    <div class="stat-label">Active UIDs</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-icon"><i class="fas fa-dollar-sign"></i></div>
                    <div class="stat-value">$${data.stats.total_balance.toFixed(2)}</div>
                    <div class="stat-label">Total Balance</div>
                </div>
            `;
        } else {
            // Reseller stats
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-list"></i></div>
                    <div class="stat-value">${data.stats.total_uids}</div>
                    <div class="stat-label">Total UIDs</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-value">${data.stats.active_uids}</div>
                    <div class="stat-label">Active UIDs</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-icon"><i class="fas fa-pause-circle"></i></div>
                    <div class="stat-value">${data.stats.paused_uids}</div>
                    <div class="stat-label">Paused UIDs</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                    <div class="stat-value">$${data.stats.balance.toFixed(2)}</div>
                    <div class="stat-label">Your Balance</div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('Failed to load dashboard stats', 'error');
    }
}

// Load stats on page load
loadDashboardStats();
