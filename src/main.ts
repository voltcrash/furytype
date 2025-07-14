// Import CSS
import './styles.css';

// Import modules
import { initializeAnimation, toggle_mode } from './animation.js';
import { initializeTypingTest, updateTheme } from './typing.js';

// Extend window interface for global functions
declare global {
    interface Window {
        toggle_mode: () => void;
        updateTheme: (theme: 'dark' | 'light') => void;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeAnimation();
    initializeTypingTest();
});

// Make functions globally available for onclick handlers and cross-module communication
window.toggle_mode = toggle_mode;
window.updateTheme = updateTheme; 