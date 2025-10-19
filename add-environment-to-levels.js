import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'data', 'levels-data.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const defaultEnvironment = {
    preset: 'default',
    active: true,
    skyType: 'atmosphere',
    skyColor: '',
    horizonColor: '',
    lighting: 'distant',
    shadow: false,
    shadowSize: 10,
    lightPosition: '0 1 -0.2',
    fog: 0,
    flatShading: false,
    playArea: 1,
    stageSize: 200,
    ground: 'hills',
    groundYScale: 3,
    groundTexture: 'none',
    groundColor: '#553e35',
    groundColor2: '#694439',
    groundDensity: 64,
    groundFrequency: 10,
    dressing: 'none',
    dressingAmount: 10,
    dressingColor: '#795449',
    dressingScale: 5,
    dressingVariance: '1 1 1',
    dressingUniformScale: true,
    grid: 'none',
    gridColor: '#ccc',
    seed: 1
};

let added = 0;
data.levels.forEach((level) => {
    if (!level.environment) {
        level.environment = JSON.parse(JSON.stringify(defaultEnvironment));
        added++;
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log(`✅ Adicionada configuração de environment em ${added} níveis`);
