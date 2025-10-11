#!/usr/bin/env node

/**
 * Script de desenvolvimento para projeto A-Frame com Vite
 * Facilita o início do desenvolvimento e configurações
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

console.log('🚀 Iniciando projeto A-Frame com Vite...\n');

// Verifica se as dependências estão instaladas
if (!existsSync('node_modules')) {
    console.log('📦 Instalando dependências...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependências instaladas com sucesso!\n');
    } catch (error) {
        console.error('❌ Erro ao instalar dependências:', error.message);
        process.exit(1);
    }
}

// Inicia o servidor de desenvolvimento
console.log('🏗️  Iniciando servidor de desenvolvimento...');
console.log('📱 O projeto estará disponível em:');
console.log('   - Local:    http://localhost:3000');
console.log('   - Network:  http://[seu-ip]:3000');
console.log('');
console.log('💡 Dicas:');
console.log('   - Use Ctrl+C para parar o servidor');
console.log('   - O hot reload está ativo para desenvolvimento');
console.log('   - Teste em dispositivos móveis usando o IP da rede');
console.log('   - Para VR, certifique-se que o dispositivo está na mesma rede\n');

try {
    execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    process.exit(1);
}