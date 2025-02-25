class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initializeElements();
        this.setupEventListeners();
        this.checkLoginStatus();
    }
    
    initializeElements() {
        // Login modal elements will be created dynamically
        this.createLoginModal();
    }
    
    createLoginModal() {
        const modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-user"></i> Login to Budget Tracker</h2>
                </div>
                <div class="login-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <div class="login-buttons">
                        <button id="loginBtn" class="btn btn-primary"><i class="fas fa-sign-in-alt"></i> Login</button>
                        <button id="registerBtn" class="btn btn-secondary"><i class="fas fa-user-plus"></i> Register</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: none;
                position: fixed;
                z-index: 1001;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                align-items: center;
                justify-content: center;
            }
            
            .modal.active {
                display: flex;
            }
            
            .modal-content {
                background-color: white;
                padding: 2rem;
                border-radius: 1rem;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                animation: fadeIn 0.3s ease-out;
            }
            
            .modal-header {
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid var(--secondary-color);
            }
            
            .modal-header h2 {
                color: var(--primary-color);
                font-size: 1.5rem;
                font-weight: 600;
            }
            
            .login-buttons {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .btn-secondary {
                background-color: #6b7280;
                color: white;
            }
            
            .btn-secondary:hover {
                background-color: #4b5563;
                transform: translateY(-1px);
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-left: auto;
            }
            
            .user-info span {
                font-weight: 500;
            }
            
            .logout-btn {
                background-color: transparent;
                color: var(--text-color);
                padding: 0.5rem;
                border-radius: 0.375rem;
                border: 1px solid var(--border-color);
            }
            
            .logout-btn:hover {
                background-color: var(--secondary-color);
            }
        `;
        document.head.appendChild(style);
    }
    
    setupEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('registerBtn').addEventListener('click', () => this.register());
    }
    
    checkLoginStatus() {
        const userData = localStorage.getItem('budgetTrackerUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.showApp();
            this.updateUserInfo();
            this.checkMonthlyReset();
        } else {
            this.showLoginModal();
        }
    }
    
    login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            notificationManager.show('Please enter both username and password', 'error');
            return;
        }
        
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = {
                id: user.id,
                username: user.username,
                lastLogin: new Date().toISOString()
            };
            
            localStorage.setItem('budgetTrackerUser', JSON.stringify(this.currentUser));
            this.hideLoginModal();
            this.showApp();
            this.updateUserInfo();
            this.checkMonthlyReset();
            notificationManager.show('Login successful!', 'success');
        } else {
            notificationManager.show('Invalid username or password', 'error');
        }
    }
    
    register() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            notificationManager.show('Please enter both username and password', 'error');
            return;
        }
        
        // Get users from storage
        const users = JSON.parse(localStorage.getItem('budgetTrackerUsers') || '[]');
        
        // Check if username already exists
        if (users.some(u => u.username === username)) {
            notificationManager.show('Username already exists', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            password
        };
        
        users.push(newUser);
        localStorage.setItem('budgetTrackerUsers', JSON.stringify(users));
        
        this.currentUser = {
            id: newUser.id,
            username: newUser.username,
            lastLogin: new Date().toISOString()
        };
        
        localStorage.setItem('budgetTrackerUser', JSON.stringify(this.currentUser));
        this.hideLoginModal();
        this.showApp();
        this.updateUserInfo();
        notificationManager.show('Registration successful!', 'success');
    }
    
    logout() {
        localStorage.removeItem('budgetTrackerUser');
        this.currentUser = null;
        this.hideApp();
        this.showLoginModal();
        notificationManager.show('Logged out successfully', 'success');
    }
    
    updateUserInfo() {
        if (!document.querySelector('.user-info')) {
            const headerDiv = document.querySelector('.header');
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            userInfo.innerHTML = `
                <i class="fas fa-user"></i>
                <span id="currentUser">${this.currentUser.username}</span>
                <button id="logoutBtn" class="btn logout-btn"><i class="fas fa-sign-out-alt"></i></button>
            `;
            headerDiv.appendChild(userInfo);
            
            document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        } else {
            document.getElementById('currentUser').textContent = this.currentUser.username;
        }
    }
    
    showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.add('active');
    }
    
    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.classList.remove('active');
    }
    
    showApp() {
        document.querySelector('.container').style.display = 'block';
    }
    
    hideApp() {
        document.querySelector('.container').style.display = 'none';
    }
    
    checkMonthlyReset() {
        if (!this.currentUser) return;
        
        // Get the user's budget data
        const storageKey = `budgetTrackerData_${this.currentUser.id}`;
        let userData = JSON.parse(localStorage.getItem(storageKey) || '{"budget":0,"expenses":[],"lastResetDate":""}');
        
        // Check if we need to reset the budget (new month)
        const currentDate = new Date();
        const lastResetDate = userData.lastResetDate ? new Date(userData.lastResetDate) : null;
        
        if (!lastResetDate || 
            lastResetDate.getMonth() !== currentDate.getMonth() || 
            lastResetDate.getFullYear() !== currentDate.getFullYear()) {
            
            // Keep the budget amount but clear expenses at the start of a new month
            userData = {
                budget: userData.budget,
                expenses: [],
                lastResetDate: currentDate.toISOString()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(userData));
            notificationManager.show('Monthly budget has been reset. Previous expenses have been cleared.', 'info', 5000);
        }
    }
}

// The auth manager should be initialized after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});