import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import data from './scripts/build-data.js'

export default defineConfig({
    plugins: [react(), data()],
    base: '/csconfs/',
    build: {
        outDir: 'dist'
    }
})
