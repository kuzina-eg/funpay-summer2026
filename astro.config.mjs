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
                    /*
                        Две точки входа: основная вёрстка и страница «Комп мечты».
                        Имена бандлов Astro даёт служебные — скрипт зовётся по
                        лейауту, стили по первой странице, которая их запросила
                        (dream-pc-*.css против home.css / finish-*.css). По этому
                        признаку и разводим, чтобы имена файлов остались
                        читаемыми и постоянными.
                    */
                    entryFileNames: (chunk) => {
                        if (chunk.name.includes('DreamLayout')) return 'js/dream.js';
                        if (chunk.name.includes('PcLayout')) return 'js/pc.js';

                        return 'js/main.js';
                    },
                    assetFileNames: (asset) => {
                        const name = asset.names?.[0] ?? asset.name ?? '';

                        if (!name.endsWith('.css')) return 'assets/[name][extname]';

                        // Порядок важен: файл старой страницы зовётся dream-pc-*.css
                        // и подходит под оба условия, поэтому проверяется первым.
                        if (name.includes('dream')) return 'css/dream.css';
                        if (name.startsWith('pc')) return 'css/pc.css';

                        return 'css/style.css';
                    },
                }
            },
            format: 'file',
            minify: 'terser',
        }
    }
});
