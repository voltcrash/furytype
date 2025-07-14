import './styles.css';

import { initializeAnimation, toggle_mode } from './animation.js';
import { initializeTypingTest, updateTheme } from './typing.js';

declare global {
    interface Window {
        toggle_mode: () => void;
        updateTheme: (theme: 'dark' | 'light') => void;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAnimation();
    initializeTypingTest();
});

// Make functions globally available for onclick handlers and cross-module communication
window.toggle_mode = toggle_mode;
window.updateTheme = updateTheme; 