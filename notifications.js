class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
        
        // Add the notification container styles
        const style = document.createElement('style');
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 1000;
            }
            
            .notification {
                padding: 10px 20px;
                border-radius: 4px;
                color: white;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                animation: slideIn 0.3s ease-out;
                position: relative; /* Changed from fixed to relative */
                /* Removed top and right properties */
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
    }
    
    show(message, type, duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        this.notifications.push(notification);
        
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    remove(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease-out';
        
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
            this.notifications = this.notifications.filter(n => n !== notification);
        }, 300);
    }
}

// Create a global instance
const notificationManager = new NotificationManager();