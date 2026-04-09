const path = require('path')
const { defineConfig } = require('vite')
const vuePlugin = require('@vitejs/plugin-vue')

const vue = vuePlugin.default || vuePlugin

module.exports = defineConfig({
    plugins: [vue()],
    build: {
        outDir: path.resolve(__dirname, 'dist'),
        emptyOutDir: true,
        sourcemap: false,
        rollupOptions: {
            input: './client/index.js',
            output: {
                entryFileNames: 'app.bundle.js',
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                        return 'style.css'
                    }
                    return '[name].[ext]'
                },
            },
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
                secure: false,
            },
            '/assets': {
                target: 'http://127.0.0.1:3000',
                changeOrigin: true,
            },
        },
    },
})

