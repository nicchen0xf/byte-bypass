// Check authentication and role
function checkAuth(requiredRole = null) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    
    const userData = JSON.parse(user);
    
    // Check role if specified
    if (requiredRole && userData.role !== requiredRole) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Update user info in UI
    const usernameEl = document.getElementById('username-display');
    const roleEl = document.getElementById('role-display');
    const balanceEl = document.getElementById('balance-display');
    
    if (usernameEl) usernameEl.textContent = userData.username;
    if (roleEl) roleEl.textContent = userData.role.toUpperCase();
    if (balanceEl && userData.role === 'reseller') {
        balanceEl.textContent = '$' + userData.balance.toFixed(2);
    }
    
    return true;
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// API call helper
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    if (!response.ok) {
        // If 401, redirect to login
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
        throw new Error(data.message || 'API request failed');
    }
    
    return data;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Calculate time remaining
function getTimeRemaining(expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h`;
    } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes}m`;
    }
}

// Update countdown timers
function updateCountdowns() {
    document.querySelectorAll('[data-expires]').forEach(element => {
        const expires = element.getAttribute('data-expires');
        element.textContent = getTimeRemaining(expires);
    });
}

// Start countdown updater
setInterval(updateCountdowns, 60000); // Update every minute
