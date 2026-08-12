import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    server: {
        port: 3000,
    },
    build: {
        format: 'file',
    },
    vite: {
        build: {
            rollupOptions: {
                output: {
                    entryFileNames: 'js/main.js',
                    assetFileNames: 'css/style.css',
                }
            },
            format: 'file',
            minify: 'terser',
        }
    }
});
