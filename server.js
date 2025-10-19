import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Permitir CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Rota para carregar dados
app.get('/api/levels', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'levels-data.json');
        const data = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        res.status(500).json({ error: 'Erro ao carregar dados' });
    }
});

// Rota para salvar dados
app.post('/api/levels', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data', 'levels-data.json');


        // Criar backup
        const backupPath = path.join(__dirname, 'data', `levels-data.backup.${Date.now()}.json`);
        try {
            await fs.copyFile(filePath, backupPath);
            console.log('✅ Backup criado:', backupPath);

            // Limitar backups a 10 arquivos de cada tipo
            const dataDir = path.join(__dirname, 'data');
            const files = await fs.readdir(dataDir);

            // Limpa backups normais
            const backups = files
                .filter(f => f.startsWith('levels-data.backup.') && f.endsWith('.json'))
                .sort((a, b) => {
                    const ta = parseInt(a.match(/backup\.(\d+)\.json/)[1]);
                    const tb = parseInt(b.match(/backup\.(\d+)\.json/)[1]);
                    return ta - tb; // mais antigo primeiro
                });
            if (backups.length > 10) {
                const toDelete = backups.slice(0, backups.length - 10); // remove os mais antigos
                for (const f of toDelete) {
                    try {
                        await fs.unlink(path.join(dataDir, f));
                        console.log('🗑️ Backup removido:', f);
                    } catch (err) {
                        console.warn('⚠️ Erro ao remover backup:', f, err.message);
                    }
                }
            }

            // Limpa backups de restauração
            const beforeRestore = files
                .filter(f => f.startsWith('levels-data.before-restore.') && f.endsWith('.json'))
                .sort((a, b) => {
                    const ta = parseInt(a.match(/before-restore\.(\d+)\.json/)[1]);
                    const tb = parseInt(b.match(/before-restore\.(\d+)\.json/)[1]);
                    return tb - ta;
                });
            if (beforeRestore.length > 10) {
                const toDelete = beforeRestore.slice(10);
                for (const f of toDelete) {
                    try {
                        await fs.unlink(path.join(dataDir, f));
                        console.log('🗑️ Backup before-restore removido:', f);
                    } catch (err) {
                        console.warn('⚠️ Erro ao remover backup before-restore:', f, err.message);
                    }
                }
            }
        } catch (backupError) {
            console.warn('⚠️ Aviso ao criar backup:', backupError.message);
        }

        // Salvar novo arquivo
        await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf-8');

        res.json({
            success: true,
            message: 'Dados salvos com sucesso!',
            backup: backupPath
        });
        console.log('💾 Arquivo salvo com sucesso');
    } catch (error) {
        console.error('Erro ao salvar arquivo:', error);
        res.status(500).json({ error: 'Erro ao salvar dados', details: error.message });
    }
});

// Rota para listar backups
app.get('/api/backups', async (req, res) => {
    try {
        const dataDir = path.join(__dirname, 'data');
        const files = await fs.readdir(dataDir);
        const backups = files
            .filter(f => f.startsWith('levels-data.backup'))
            .map(f => ({
                name: f,
                path: `/data/${f}`
            }))
            .sort()
            .reverse();

        res.json(backups);
    } catch (error) {
        console.error('Erro ao listar backups:', error);
        res.status(500).json({ error: 'Erro ao listar backups' });
    }
});

// Rota para restaurar backup
app.post('/api/restore/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;

        // Validar nome do arquivo
        if (!filename.startsWith('levels-data.backup')) {
            throw new Error('Nome de arquivo inválido');
        }

        const backupPath = path.join(__dirname, 'data', filename);
        const mainPath = path.join(__dirname, 'data', 'levels-data.json');

        // Verificar se arquivo existe
        await fs.access(backupPath);

        // Criar backup do arquivo atual antes de restaurar
        const currentBackup = path.join(__dirname, 'data', `levels-data.before-restore.${Date.now()}.json`);
        await fs.copyFile(mainPath, currentBackup);

        // Restaurar
        const data = await fs.readFile(backupPath, 'utf-8');
        await fs.writeFile(mainPath, data, 'utf-8');

        res.json({
            success: true,
            message: 'Backup restaurado com sucesso!',
            restored: filename
        });
        console.log('♻️ Backup restaurado:', filename);
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        res.status(500).json({ error: 'Erro ao restaurar backup', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║  🎮 Level Editor Server                   ║
║  Editor: http://localhost:3000            ║
║  API: http://localhost:${PORT}            ║
╚═══════════════════════════════════════════╝
    `);
});
