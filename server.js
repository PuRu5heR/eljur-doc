const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const JSON_FILE = path.join(DATA_DIR, 'database.json');

async function initDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log('Создана папка data/');
    }
}

async function loadTablesData() {
    await initDataDir();

    try {
        await fs.access(JSON_FILE);
        const jsonContent = await fs.readFile(JSON_FILE, 'utf-8');
        return JSON.parse(jsonContent);
    } catch {
        console.error('Файл database.json не найден в папке data/');
        console.log('Поместите файл database.json в папку data/');
        return {};
    }
}

app.get('/api/tables', async (req, res) => {
    try {
        const tables = await loadTablesData();
        res.json({ success: true, data: tables });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/tables/:name', async (req, res) => {
    try {
        const tables = await loadTablesData();
        const table = tables[req.params.name];
        if (table) {
            res.json({ success: true, data: table });
        } else {
            res.status(404).json({ success: false, error: 'Table not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(
`
Сервер запущен
Локальный доступ: http://localhost:${PORT}
Данные загружаются из: data/database.json
`
    );
});