// ═══════════════════════════════════════════
// SHIELD — Authentication Module
// ═══════════════════════════════════════════

const API_BASE_URL = 'http://localhost:3000/api';

// ── Local Storage Keys ──
const TOKEN_KEY = 'shield_token';
const USER_KEY = 'shield_user';

// ── Get stored token ──
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// ── Get stored user ──
function getUser() {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

// ── Save auth data ──
function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Clear auth data ──
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── Check if user is logged in ──
function isLoggedIn() {
  return !!getToken();
}

// ── Register User ──
async function register(name, email, phone, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await response.json();

    if (data.success) {
      saveAuth(data.token, data.user);
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// ── Login User ──
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      saveAuth(data.token, data.user);
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message };
    }
  } catch (error) {
    return { success: false, message: 'Network error. Please try again.' };
  }
}

// ── Logout User ──
function logout() {
  clearAuth();
  window.location.href = '/';
}

// ── Get Current User from API ──
async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    } else {
      clearAuth();
      return null;
    }
  } catch (error) {
    return null;
  }
}

// ── Make Authenticated API Call ──
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: 'Network error' };
  }
}

// Export functions
window.ShieldAuth = {
  register,
  login,
  logout,
  isLoggedIn,
  getUser,
  getToken,
  getCurrentUser,
  apiCall
};
