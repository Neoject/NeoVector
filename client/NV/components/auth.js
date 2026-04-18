const API_BASE = '/api';

function apiFetch(path, options = {}) {
    return fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
}

export async function login(username, password, remember = false) {
    try {
        const response = await apiFetch('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password, remember }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (remember) {
                localStorage.setItem('remember_username', username);
            } else {
                localStorage.removeItem('remember_username');
            }

            const userInfo = await checkUserAuth();
            return { success: true, role: userInfo.role, username: userInfo.username };
        }

        return { success: false, error: data.error || 'Login failed' };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function logout() {
    if (!confirm('Выйти из профиля?')) {
        document.querySelector('.overlay.active')?.classList.remove('active');
        return;
    }

    try {
        await apiFetch('/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout error:', e);
    } finally {
        clearAuth();
        window.location.reload();
    }
}

export async function register(username, password) {
    try {
        const response = await apiFetch('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return await login(username, password);
        }

        return { success: false, error: data.error || 'Registration failed' };
    } catch {
        return { success: false, error: 'Network error' };
    }
}

export async function checkUserAuth() {
    try {
        const response = await apiFetch('/me');

        if (response.ok) {
            const user = await response.json();
            // user = { authenticated, id, username, role }
            setAuth(user);
            return user;
        }

        clearAuth();
        return { authenticated: false, role: null, username: null };
    } catch {
        clearAuth();
        return { authenticated: false, role: null, username: null };
    }
}

export function getAuth() {
    try {
        const auth = localStorage.getItem('global_auth');
        return auth ? JSON.parse(auth) : { authenticated: false, role: null, username: null };
    } catch {
        return { authenticated: false, role: null, username: null };
    }
}

export function setAuth(authData) {
    localStorage.setItem('global_auth', JSON.stringify(authData));
}

export function clearAuth() {
    localStorage.removeItem('global_auth');
}

export function isAuthenticated() {
    const auth = getAuth();
    return auth.authenticated === true;
}

export function isAdmin() {
    const auth = getAuth();
    return auth.authenticated === true && auth.role === 'admin';
}

export function getUserRole() {
    const auth = getAuth();
    return auth.role;
}

export function getUsername() {
    const auth = getAuth();
    return auth.username;
}