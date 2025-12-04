// API Configuration
const API_BASE_URL = 'http://217.160.3.69:9125/api';

// API Endpoints
const API = {
    LOGIN: `${API_BASE_URL}/login`,
    USER_ME: `${API_BASE_URL}/user/me`,
    DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`,
    WHITELISTS: `${API_BASE_URL}/whitelists`,
    WHITELISTS_ADD: `${API_BASE_URL}/whitelists/add`,
    ADMIN_RESELLERS: `${API_BASE_URL}/admin/resellers`,
    PRICING: `${API_BASE_URL}/pricing`
};

// Helper functions for API calls
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
        throw new Error(data.message || 'API request failed');
    }
    
    return data;
}

// Storage helpers
const Storage = {
    setToken: (token) => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token'),
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    removeUser: () => localStorage.removeItem('user'),
    clear: () => localStorage.clear()
};

// Check if user is logged in
function checkAuth() {
    const token = Storage.getToken();
    const user = Storage.getUser();
    
    if (!token || !user) {
        window.location.href = 'index.html';
        return false;
    }
    
    return true;
}

// Logout function
function logout() {
    Storage.clear();
    window.location.href = 'index.html';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
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
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
