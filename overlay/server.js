import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPackaged = process.pkg ? true : false;
const executionDir = isPackaged
    ? path.dirname(process.execPath)
    : __dirname;
const CONFIG_PATH = path.join(executionDir, 'overlay.conf');
const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const homePath = path.join(__dirname, 'src');
const overlays = fs.readdirSync(homePath).filter(file => file.endsWith('.html') && file !== 'index.html');

app.use(express.static(homePath));
app.get('/', (req, res) => {
    res.send(overlays.map(file => `<a href="${file}">${file}</a>`).join('<br>'));
});
app.get('/config', (req, res) => {
    if (fs.existsSync(CONFIG_PATH)) {
        res.sendFile(CONFIG_PATH);
    } else {
        res.status(404).send('Configuration file not found.');
    }
});

server.listen(PORT, async () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`\n==================================================`);
    console.log(`  Stream Overlay App is Running!`);
    console.log(`  Dashboard:   ${localUrl}`);
    console.log(`  Overlays:`);
    console.log(`\t${overlays.join(',\n\t')}`);
    console.log(`  Config File: ${CONFIG_PATH}`);
    console.log(`==================================================\n`);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});