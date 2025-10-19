import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data', 'levels-data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('✅ Verificação de Environment Config\n');
data.levels.forEach((level, idx) => {
    const hasEnv = !!level.environment;
    const fields = hasEnv ? Object.keys(level.environment).length : 0;
    const preset = hasEnv ? level.environment.preset : 'N/A';
    console.log(`Level ${level.id} (${level.name}): ${hasEnv ? '✓' : '✗'} | ${fields} campos | Preset: ${preset}`);
});

console.log(`\n📊 Total: ${data.levels.length} níveis`);
const withEnv = data.levels.filter(l => !!l.environment).length;
console.log(`✓ Com environment: ${withEnv}`);
console.log(`✗ Sem environment: ${data.levels.length - withEnv}`);
