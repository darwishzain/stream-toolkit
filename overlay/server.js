import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import open from 'open';
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

const DEFAULT_CONFIG = {
    port: 3000,
    autoOpenBrowser: true,
    defaultLowerThirdTitle: "Welcome to the Stream!",
    defaultLowerThirdSub: "Follow for more content"
};

function loadOrCreateConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
        console.log(`[Config] Created new config file at: ${CONFIG_PATH}`);
        return DEFAULT_CONFIG;
        }
        const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
        console.log(`[Config] Loaded config from: ${CONFIG_PATH}`);
        return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    } catch (err) {
        console.error('[Config] Error reading config file, falling back to defaults:', err);
        return DEFAULT_CONFIG;
    }
}

const config = loadOrCreateConfig();
const PORT = config.port || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Parse JSON request bodies for setting updates
app.use(express.json());

const publicPath = path.join(__dirname, 'src');
app.use(express.static(publicPath));

// Dashboard Route
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Serve current config data to dashboard API
app.get('overlay.conf', (req, res) => {
    res.json(config);
});
app.get('/api/config', (req, res) => {
    try {
        const rawData = fs.readFileSync(CONFIG_PATH, 'utf-8');
        const config = JSON.parse(rawData);
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read config file' });
    }
});

// Update config API
app.post('overlay.conf', (req, res) => {
    try {
        const updatedConfig = { ...config, ...req.body };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedConfig, null, 2), 'utf-8');
        res.json({ success: true, config: updatedConfig });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Send current config state on connection
    socket.emit('init-config', config);

    // Relay Lower Third updates
    socket.on('update-lower-third', (data) => {
        io.emit('render-lower-third', data);
    });

    // Relay Alert triggers
    socket.on('trigger-alert', (data) => {
        io.emit('render-alert', data);
    });

    // Relay Goal Bar updates
    socket.on('update-goal', (data) => {
        io.emit('render-goal', data);
    });
});

server.listen(PORT, async () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`\n==================================================`);
    console.log(`  Stream Overlay App is Running!`);
    console.log(`  Dashboard:   ${localUrl}`);
    console.log(`  Config File: ${CONFIG_PATH}`);
    console.log(`==================================================\n`);

    if (config.autoOpenBrowser) {
        try {
            await open(localUrl);
        } catch (err) {
            console.log(`Open browser manually at: ${localUrl}`);
        }
    }
});