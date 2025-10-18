import { apiService } from './api/apiService.js';
import { dashboard } from './modules/dashboard.js';
import { properties } from './modules/properties.js';
import { tenants } from './modules/tenants.js';
import { maintenance } from './modules/maintenance.js';
import { finances } from './modules/finances.js';
import { users } from './modules/users.js';
import { showNotification } from './utils/notifications.js';
import { MobileNavigation } from './utils/mobileNav.js';

class HMISApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }

        this.currentUser = JSON.parse(localStorage.getItem('user'));
        this.setupNavigation();
        this.loadInitialData();
        this.setupEventListeners();
        this.setupUI();
        this.handleHashNavigation(); // Add hash navigation
    }

    checkAuthentication() {
        if (!localStorage.getItem('authToken')) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    setupUI() {
        this.updateUserInfo();
        this.setupRoleBasedUI();
    }

    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        const userNameElement = document.getElementById('userName');
        
        if (userInfoElement && this.currentUser) {
            userInfoElement.innerHTML = `
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-2"></i>
                        ${this.currentUser.first_name} ${this.currentUser.last_name}
                        <span class="badge bg-${this.getRoleBadgeClass()} ms-2">${this.currentUser.role}</span>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="hmisApp.showProfile()"><i class="fas fa-user me-2"></i>Profile</a></li>
                        ${this.currentUser.role === 'admin' ? '<li><a class="dropdown-item" href="#" onclick="hmisApp.switchSection(\'users\')"><i class="fas fa-users me-2"></i>User Management</a></li>' : ''}
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="hmisApp.logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                    </ul>
                </div>
            `;
        }

        if (userNameElement && this.currentUser) {
            userNameElement.textContent = `${this.currentUser.first_name} ${this.currentUser.last_name}`;
        }
    }

    getRoleBadgeClass() {
        const classes = {
            'admin': 'danger',
            'manager': 'warning',
            'staff': 'info'
        };
        return classes[this.currentUser.role] || 'secondary';
    }

    setupRoleBasedUI() {
        // Hide admin-only features for non-admin users
        if (this.currentUser.role !== 'admin') {
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(el => el.style.display = 'none');
        }

        // Hide manager-only features for staff users
        if (this.currentUser.role === 'staff') {
            const managerElements = document.querySelectorAll('.manager-only');
            managerElements.forEach(el => el.style.display = 'none');
        }
    }

    setupNavigation() {
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(link.dataset.section);
            });
        });

        // Initialize mobile navigation
        this.mobileNav = new MobileNavigation();
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-logout]')) {
                this.logout();
            }
        });

        // Handle footer navigation links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href*="#"]');
            if (link && link.getAttribute('href').includes('dashboard.html#')) {
                e.preventDefault();
                const section = link.getAttribute('href').split('#')[1];
                if (this.isValidSection(section)) {
                    this.switchSection(section);
                }
            }
        });
    }

    // NEW: Handle URL hash navigation
    handleHashNavigation() {
        // Check URL hash when page loads
        const hash = window.location.hash.replace('#', '');
        if (hash && this.isValidSection(hash)) {
            this.switchSection(hash);
        }

        // Listen for hash changes (when user uses browser back/forward)
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.replace('#', '');
            if (newHash && this.isValidSection(newHash)) {
                this.switchSection(newHash);
            }
        });
    }

    // NEW: Validate section names
    isValidSection(sectionName) {
        const validSections = ['dashboard', 'properties', 'tenants', 'maintenance', 'finances', 'users'];
        return validSections.includes(sectionName);
    }

    switchSection(sectionName) {
        if (!this.isValidSection(sectionName)) {
            console.warn(`Invalid section: ${sectionName}`);
            return;
        }

        // Update active navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const navLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show current section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            this.currentSection = sectionName;
            
            // Update URL hash for bookmarking
            if (window.location.hash !== `#${sectionName}`) {
                history.replaceState(null, null, `#${sectionName}`);
            }
            
            // Load section data
            this.loadSectionData(sectionName);
        }
    }

    loadSectionData(sectionName) {
        switch(sectionName) {
            case 'dashboard':
                dashboard.load();
                break;
            case 'properties':
                properties.load();
                break;
            case 'tenants':
                tenants.load();
                break;
            case 'maintenance':
                maintenance.load();
                break;
            case 'finances':
                finances.load();
                break;
            case 'users':
                if (this.currentUser.role === 'admin') {
                    users.load();
                } else {
                    this.showNotification('Access denied. Admin privileges required.', 'error');
                    this.switchSection('dashboard');
                }
                break;
        }
    }

    loadInitialData() {
        dashboard.load();
    }

    showProfile() {
        showNotification('Profile feature coming soon!', 'info');
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    showNotification(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        
        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-white bg-${this.getBootstrapColor(type)} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toastEl);
        
        const toast = new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: 5000
        });
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

    // Utility method to refresh current section
    refreshCurrentSection() {
        this.loadSectionData(this.currentSection);
    }

    // Method to handle API errors globally
    handleApiError(error, context = '') {
        console.error(`API Error in ${context}:`, error);
        
        if (error.message.includes('401') || error.message.includes('Token')) {
            this.showNotification('Session expired. Please login again.', 'error');
            setTimeout(() => this.logout(), 2000);
        } else if (error.message.includes('403')) {
            this.showNotification('Access denied. Insufficient permissions.', 'error');
        } else {
            this.showNotification(`Operation failed: ${error.message}`, 'error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hmisApp = new HMISApp();
});

// Make showNotification available globally for other modules
export { showNotification };