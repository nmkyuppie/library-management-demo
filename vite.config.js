import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // Use relative base path so it works on GitHub Pages regardless of repository name
    base: './',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                admin: resolve(__dirname, 'admin.html'),
                books: resolve(__dirname, 'books.html'),
                bookDetail: resolve(__dirname, 'book-detail.html'),
                userDetail: resolve(__dirname, 'user-detail.html')
            }
        }
    }
});
