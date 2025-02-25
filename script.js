class BudgetTracker {
    constructor() {
        this.budget = 0;
        this.expenses = [];
        this.initializeElements();
        this.setupEventListeners();
        this.initializeCurrencyConverter();
        
        // We'll load data after login is confirmed
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for auth manager to initialize
            setTimeout(() => {
                if (window.authManager && window.authManager.currentUser) {
                    this.loadFromLocalStorage();
                    this.updateUI();
                }
            }, 100);
        });
    }

    initializeElements() {
        // Budget elements
        this.budgetInput = document.getElementById('budgetAmount');
        this.setBudgetBtn = document.getElementById('setBudget');
        this.currentBudgetEl = document.getElementById('currentBudget');
        this.remainingBudgetEl = document.getElementById('remainingBudget');

        // Expense elements
        this.expenseForm = document.getElementById('expenseForm');
        this.expenseList = document.getElementById('expenseList');
        this.expenseChart = document.getElementById('expenseChart');

        // Currency converter elements
        this.fromCurrency = document.getElementById('fromCurrency');
        this.toCurrency = document.getElementById('toCurrency');
        this.convertAmount = document.getElementById('amount');
        this.convertBtn = document.getElementById('convertCurrency');
        this.conversionResult = document.getElementById('conversionResult');
    }

    setupEventListeners() {
        this.setBudgetBtn.addEventListener('click', () => this.setBudget());
        this.expenseForm.addEventListener('submit', (e) => this.addExpense(e));
        this.convertBtn.addEventListener('click', () => this.convertCurrency());
    }

    setBudget() {
        const amount = parseFloat(this.budgetInput.value);
        if (amount > 0) {
            this.budget = amount;
            this.saveToLocalStorage();
            this.updateUI();
            this.showNotification('Budget updated successfully!', 'success');
        }
    }

    addExpense(e) {
        e.preventDefault();
        const title = document.getElementById('expenseTitle').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;

        if (title && amount > 0) {
            const expense = {
                id: Date.now(),
                title,
                amount,
                category,
                date: new Date()
            };

            this.expenses.push(expense);
            this.saveToLocalStorage();
            this.updateUI();
            this.expenseForm.reset();
            this.showNotification('Expense added successfully!', 'success');
        }
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification('Expense deleted successfully!', 'success');
    }

    calculateTotalExpenses() {
        return this.expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    updateUI() {
        // Update budget display
        this.currentBudgetEl.textContent = `$${this.budget.toFixed(2)}`;
        const remaining = this.budget - this.calculateTotalExpenses();
        this.remainingBudgetEl.textContent = `$${remaining.toFixed(2)}`;
        this.remainingBudgetEl.style.color = remaining >= 0 ? 'var(--success-color)' : 'var(--danger-color)';

        // Update expense list
        this.updateExpenseList();

        // Update chart
        this.updateChart();

        // Update budget status
        this.updateBudgetStatus(remaining);
    }

    updateBudgetStatus(remaining) {
        const percentage = (remaining / this.budget) * 100;
        if (percentage < 20 && this.budget > 0) {
            this.showNotification('Warning: You have less than 20% of your budget remaining!', 'warning');
        }
    }

    updateExpenseList() {
        this.expenseList.innerHTML = '';
        this.expenses.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
            const expenseEl = document.createElement('div');
            expenseEl.className = 'expense-item';
            expenseEl.innerHTML = `
                <div>
                    <strong>${expense.title}</strong>
                    <p>${expense.category}</p>
                    <small>${new Date(expense.date).toLocaleDateString()}</small>
                </div>
                <div>
                    <span>$${expense.amount.toFixed(2)}</span>
                    <button class="btn btn-danger" onclick="budgetTracker.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            this.expenseList.appendChild(expenseEl);
        });
    }

    updateChart() {
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const data = {
            labels: Object.keys(categoryTotals),
            datasets: [{
                data: Object.values(categoryTotals),
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#ec4899'
                ]
            }]
        };

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        this.chartInstance = new Chart(this.expenseChart, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    async initializeCurrencyConverter() {
        try {
            const response = await fetch('https://api.frankfurter.app/currencies');
            const currencies = await response.json();
            
            Object.entries(currencies).forEach(([code, name]) => {
                const option1 = new Option(`${code} - ${name}`, code);
                const option2 = new Option(`${code} - ${name}`, code);
                this.fromCurrency.add(option1);
                this.toCurrency.add(option2);
            });

            // Set default values
            this.fromCurrency.value = 'USD';
            this.toCurrency.value = 'EUR';
        } catch (error) {
            console.error('Error loading currencies:', error);
            this.showNotification('Error loading currencies. Please try again later.', 'error');
        }
    }

    async convertCurrency() {
        try {
            const amount = parseFloat(this.convertAmount.value);
            const from = this.fromCurrency.value;
            const to = this.toCurrency.value;
    
            if (!amount || isNaN(amount)) {
                this.showNotification('Please enter a valid amount', 'error');
                return;
            }
    
            // If same currency, no need to convert
            if (from === to) {
                this.conversionResult.textContent = `${amount.toFixed(2)} ${to}`;
                return;
            }
    
            // Using Frankfurter API for accurate conversion
            const response = await fetch(
                `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`
            );
            
            if (!response.ok) {
                throw new Error('Currency conversion failed');
            }
    
            const data = await response.json();
            
            if (data.rates && data.rates[to]) {
                const result = data.rates[to];
                this.conversionResult.textContent = `${result.toFixed(2)} ${to}`;
                this.showNotification('Currency converted successfully!', 'success');
            } else {
                throw new Error('Invalid conversion rate received');
            }
        } catch (error) {
            console.error('Error converting currency:', error);
            this.showNotification('Error converting currency. Please try again.', 'error');
            this.conversionResult.textContent = 'Error';
        }
    }

    showNotification(message, type) {
        // Use the notification manager instead
        if (window.notificationManager) {
            notificationManager.show(message, type);
        } else {
            // Fallback to original method if notification manager isn't loaded
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    saveToLocalStorage() {
        if (!window.authManager || !window.authManager.currentUser) return;
        
        const userId = window.authManager.currentUser.id;
        const storageKey = `budgetTrackerData_${userId}`;
        
        // Get the existing data which might include the lastResetDate
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '{"budget":0,"expenses":[],"lastResetDate":""}');
        
        localStorage.setItem(storageKey, JSON.stringify({
            budget: this.budget,
            expenses: this.expenses,
            lastResetDate: existingData.lastResetDate || new Date().toISOString()
        }));
    }

    loadFromLocalStorage() {
        try {
            if (!window.authManager || !window.authManager.currentUser) return;
            
            const userId = window.authManager.currentUser.id;
            const storageKey = `budgetTrackerData_${userId}`;
            
            const data = JSON.parse(localStorage.getItem(storageKey) || '{"budget":0,"expenses":[],"lastResetDate":""}');
            this.budget = data.budget;
            this.expenses = data.expenses;
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            this.budget = 0;
            this.expenses = [];
        }
    }

    exportData() {
        const data = {
            budget: this.budget,
            expenses: this.expenses,
            totalExpenses: this.calculateTotalExpenses(),
            remaining: this.budget - this.calculateTotalExpenses(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budget-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
// Initialize the budget tracker
const budgetTracker = new BudgetTracker();

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        border-radius: 4px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }

    .notification.success {
        background-color: var(--success-color);
    }

    .notification.error {
        background-color: var(--danger-color);
    }

    .notification.warning {
        background-color: #f59e0b;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

