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
      input: './src/admin/index.js',
      output: {
        entryFileNames: 'admin.bundle.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'admin.css'
          }
          return '[name].[ext]'
        },
      },
    },
  },
})

