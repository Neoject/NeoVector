import {getApiUrl} from "../NV";

export async function login(username, password, remember = false) {
    try {
        const apiUrl = getApiUrl();
        const form = new FormData();

        form.append('action', 'login');
        form.append('username', username);
        form.append('password', password);

        if (remember) {
            form.append('remember', '1');
            localStorage.setItem('remember_username', username);
        } else {
            localStorage.removeItem('remember_username');
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: form,
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            const userInfo = await checkUserAuth();
            setAuth(userInfo);
            return { success: true, role: userInfo.role, username: userInfo.username };
        } else {
            return { success: false, error: data.error || 'Login failed' };
        }
    } catch (e) {
        return { success: false, error: 'Network error' };
    }
}

export async function register(username, password, role = 'user') {
    try {
        const apiUrl = getApiUrl();
        const form = new FormData();

        form.append('action', 'register');
        form.append('username', username);
        form.append('password', password);
        form.append('role', role);

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: form,
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            return { success: true };
        }

        return { success: false, error: data.error || 'Registration failed' };
    } catch (e) {
        return { success: false, error: 'Network error' };
    }
}

export async function logout() {
    if (confirm('Выйти из профиля?')) {
        try {
            const apiUrl = getApiUrl();
            const form = new FormData();

            form.append('action', 'logout');

            await fetch(apiUrl, { method: 'POST', body: form, credentials: 'same-origin' });
            window.location.reload();
        } catch (e) {
            console.log('Logout error:', e);
        }
    }

    document.querySelector('.overlay.active')?.classList.remove('active');
    clearAuth();
}

export async function checkUserAuth() {
    try {
        const apiUrl = getApiUrl();
        const response = await fetch(apiUrl + '?action=user', { credentials: 'same-origin' });

        if (response.ok) {
            const me = await response.json();
            setAuth(me);
            return me;
        } else {
            clearAuth();
            return { authenticated: false, role: null, username: null };
        }
    } catch (e) {
        clearAuth();
        return { authenticated: false, role: null, username: null };
    }
}

export function  getAuth() {
    try {
        const auth = localStorage.getItem('global_auth');
        return auth ? JSON.parse(auth) : { authenticated: false, role: null, username: null };
    } catch (e) {
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