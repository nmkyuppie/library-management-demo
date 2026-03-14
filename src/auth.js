import { login } from './db.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    if (sessionStorage.getItem('library_logged_in_user')) {
        window.location.href = '/admin.html';
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const user = login(email, password);
        if (user) {
            sessionStorage.setItem('library_logged_in_user', JSON.stringify(user));
            window.location.href = '/admin.html';
        } else {
            alert('Invalid credentials. Please verify your email and password.');
        }
    });
});
