import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
    // Configurações do servidor de desenvolvimento
    server: {
        port: 3000,
        host: true, // Permite acesso externo (para testar em dispositivos móveis)
        open: true, // Abre automaticamente no navegador
        https: {
            key: fs.readFileSync('./localhost+3-key.pem'),
            cert: fs.readFileSync('./localhost+3.pem')
        }, // HTTPS com certificados válidos para WebXR
        cors: true
    },

    // Configurações de build
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        minify: 'terser',
        target: ['es2015', 'safari11'],
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
            },
            // Trata o Three.js como external para evitar bundling duplicado
            external: [],
            output: {
                // Configura globals se necessário
                globals: {}
            }
        }
    },

    // Configurações de assets
    assetsInclude: [
        '**/*.gltf',
        '**/*.glb',
        '**/*.obj',
        '**/*.fbx',
        '**/*.dae',
        '**/*.hdr',
        '**/*.exr'
    ],

    // Aliases para imports mais limpos
    resolve: {
        alias: {
            '@': resolve(__dirname, './'),
            '@assets': resolve(__dirname, './assets'),
            '@css': resolve(__dirname, './css'),
            '@js': resolve(__dirname, './js'),
            // Previne múltiplas instâncias do Three.js
            'three': 'three'
        }
    },

    // Otimizações de dependências
    optimizeDeps: {
        // Exclui o Three.js da otimização já que o A-Frame inclui sua própria versão
        exclude: ['three'],
        // Remove aframe-physics-system já que está sendo carregado via CDN
        include: []
    },

    // Configurações específicas para WebXR e A-Frame
    define: {
        __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
        __VR_ENABLED__: JSON.stringify(true),
        __DEBUG_MODE__: JSON.stringify(process.env.NODE_ENV === 'development')
    },

    // Configurações do preview
    preview: {
        port: 4000,
        host: true,
        strictPort: true
    },

    // Configurações de cache
    cacheDir: 'node_modules/.vite',

    // Configurações de logging
    logLevel: 'info',
    clearScreen: false,

    // Configurações de base path (útil para deploy)
    base: process.env.NODE_ENV === 'production' ? './' : '/'
})