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
                    manualChunks: undefined,

                    entryFileNames: (chunk) => {
                        if (chunk.name.includes('DreamLayout')) return 'js/dream.js';
                        if (chunk.name.includes('PcLayout')) return 'js/pc.js';

                        return 'js/main.js';
                    },
                    assetFileNames: (asset) => {
                        const name = asset.names?.[0] ?? asset.name ?? '';

                        if (!name.endsWith('.css')) return 'assets/[name][extname]';
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
