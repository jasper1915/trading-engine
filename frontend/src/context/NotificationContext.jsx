import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4000);
    }, []);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                top: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none'
            }}>
                {notifications.map((n) => (
                    <Toast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

const Toast = ({ notification, onClose }) => {
    const icons = {
        success: <CheckCircle size={20} color="#22c55e" />,
        error: <XCircle size={20} color="#ef4444" />,
        warning: <AlertCircle size={20} color="#f59e0b" />,
        info: <Info size={20} color="#3b82f6" />
    };

    const colors = {
        success: 'rgba(34, 197, 94, 0.1)',
        error: 'rgba(239, 68, 68, 0.1)',
        warning: 'rgba(245, 158, 11, 0.1)',
        info: 'rgba(59, 130, 246, 0.1)'
    };

    return (
        <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${colors[notification.type]}`,
            padding: '16px',
            borderRadius: '12px',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            pointerEvents: 'auto',
            animation: 'slideIn 0.3s ease-out forwards',
            color: '#fff'
        }}>
            <style>
                {`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                `}
            </style>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {icons[notification.type]}
            </div>
            
            <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                {notification.message}
            </div>
            
            <button 
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#fff'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
            >
                <X size={16} />
            </button>
        </div>
    );
};
