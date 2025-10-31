const API_BASE = 'http://localhost:5000/api';

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;
    
    if (token && (currentPath.includes('login.html') || currentPath.includes('register.html'))) {
        window.location.href = 'index.html';
        return;
    }
    
    if (!token && !currentPath.includes('login.html') && !currentPath.includes('register.html')) {
        window.location.href = 'login.html';
        return;
    }
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Login function
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage('Login successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Register function
async function register(userData) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showMessage('Registration successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Update user in localStorage
function updateStoredUser(updatedUser) {
    localStorage.setItem('user', JSON.stringify(updatedUser));
}

// Login form handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginBtn = document.querySelector('#loginForm .auth-btn');
        const loginText = document.getElementById('loginText');
        const loginSpinner = document.getElementById('loginSpinner');
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Show loading state
        loginText.style.display = 'none';
        loginSpinner.style.display = 'inline-block';
        loginBtn.disabled = true;
        
        await login(email, password);
        
        // Reset loading state
        loginText.style.display = 'inline';
        loginSpinner.style.display = 'none';
        loginBtn.disabled = false;
    });
}

// Register form handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const registerBtn = document.querySelector('#registerForm .auth-btn');
        const registerText = document.getElementById('registerText');
        const registerSpinner = document.getElementById('registerSpinner');
        
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (formData.password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }
        
        if (formData.password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
            return;
        }
        
        if (formData.username.length < 3) {
            showMessage('Username must be at least 3 characters long', 'error');
            return;
        }
        
        // Show loading state
        registerText.style.display = 'none';
        registerSpinner.style.display = 'inline-block';
        registerBtn.disabled = true;
        
        await register(formData);
        
        // Reset loading state
        registerText.style.display = 'inline';
        registerSpinner.style.display = 'none';
        registerBtn.disabled = false;
    });
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});