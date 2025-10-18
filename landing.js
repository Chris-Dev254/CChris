class LandingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingAuth();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
    }

    checkExistingAuth() {
        if (localStorage.getItem('authToken')) {
            window.location.href = 'dashboard.html';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        const loginBtn = document.getElementById('loginBtn');
        this.setButtonLoading(loginBtn, true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showNotification('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(loginBtn, false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        if (!this.validateSignupForm()) {
            return;
        }

        const formData = new FormData(e.target);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name')
        };

        const signupBtn = document.getElementById('signupBtn');
        this.setButtonLoading(signupBtn, true);

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                this.showNotification('Account created successfully!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.setButtonLoading(signupBtn, false);
        }
    }

    validateSignupForm() {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return false;
        }

        if (password.length < 8) {
            this.showNotification('Password must be at least 8 characters long', 'error');
            return false;
        }

        return true;
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }

    showNotification(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${this.getBootstrapColor(type)} border-0`;
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    getBootstrapColor(type) {
        const colors = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info'
        };
        return colors[type] || 'info';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.landingPage = new LandingPage();
});