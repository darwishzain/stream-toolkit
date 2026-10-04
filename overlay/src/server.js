const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');
const { fileURLToPath } = require('url');
const tmi = require('tmi.js');
const { Innertube, UniversalCache } = require('youtubei.js');

const PORT = process.env.PORT || 3000;
const isPackaged = process.pkg ? true : false;
const executionDir = isPackaged
    ? path.dirname(process.execPath)
    : __dirname;
const CONFIG_PATH = isPackaged
    ? path.join(path.dirname(process.execPath), 'overlay.conf')
    : path.join(__dirname, '../overlay.conf');
const homePath = path.join(__dirname, '.');
const overlays = fs.readdirSync(homePath).filter(file => file.endsWith('.html') && file !== 'index.html');

function loadConfig() {
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(raw);
        } catch (err) {
            console.error('Error parsing config.json:', err);
        }
    }
    return {};
}

const config = loadConfig();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(homePath));
app.get('/', (req, res) => {
    res.send(overlays.map(file => `<a href="${file}">${file}</a>`).join('<br>'));
});
app.get('/api/config', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(config);
});
if (config.chatbox.twitchchannel) {
    console.log(`[Twitch] Connected to channel: ${config.chatbox.twitchchannel}`);
    const client = new tmi.Client({
        channels: [config.chatbox.twitchchannel]
    });
    client.connect().catch(console.error);
    client.on('message', (channel, tags, message, self) => {
        io.emit('chatMessage', {
            platform: 'twitch',
            user: tags['display-name'] || tags.username,
            color: tags.color || '#9146FF',
            message: message,
            avatar:null
        });
    });
}
async function youtubeVideoId(youtubechannel){
    try{
        const youtube = await Innertube.create();
        const navigation = await youtube.resolveURL(`https://www.youtube.com/${youtubechannel}`);
        const channelId = navigation.payload?.browseId || navigation.endpoint?.payload?.browseId;
        if (!channelId) {
            throw new Error(`[YouTube] Could not resolve channel ID for ${youtubechannel}`);
        }
        console.log(`[YouTube] Resolved channel ID: ${channelId}`);
        const channel = await youtube.getChannel(channelId);
        const liveTab = await channel.getLiveStreams();
        //const activeVideo = liveTab.videos?.[0];
        //const liveTab = await channel.getTab('Live');
        const activeVideo = liveTab.videos?.[0] || liveTab.content?.contents?.[0];
        if (activeVideo && activeVideo.id) {
            return activeVideo.id;
        }
        /*
        const searchResults = await youtube.search(youtubechannel, { type: 'video' });

        // Find a video that is currently marked as LIVE
        const liveVideo = searchResults.videos.find(
        (v) => v.is_live || v.style === 'MOVIE_OR_SHOW' || v.badges?.some(b => b.label === 'LIVE')
        );

        if (liveVideo) {
        return liveVideo.id;
        }*/
    }
    catch(err){
        console.error('[YouTube] Error connecting to YouTube channel:', err);
    }
    return null;
}
async function youtubeChat(){
    if (!config.chatbox.youtubechannel) return;
    const youtube = await Innertube.create({ cache: new UniversalCache() });
    const videoId = await youtubeVideoId(config.chatbox.youtubechannel);
    if (!videoId) {
        console.error('[YouTube] No active live video found for the specified YouTube channel.');
        return;
    }
    const info = youtube.getInfo(videoId);
    const liveChat = await info.getLiveChat();
    console.log(`[YouTube] Connected to live chat for video ID: ${videoId}`);
    liveChat.on('chat-update', (update) => {
        if (update.type === 'chat') {
            const message = update;
            io.emit('chatMessage', {
                platform: 'youtube',
                user: message.author.name,
                color: message.author.badges?.[0]?.color || '#FF0000',
                message: message.message,
                avatar: message.author.thumbnails?.[0]?.url || null
            });
        }
    });
    liveChat.start();
}
if (config.chatbox.youtubechannel) {
    youtubeChat().catch(err => {
        console.error('[YouTube] Error connecting to YouTube live chat:', err);
    });
}
server.listen(PORT, async () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`\n==================================================`);
    console.log(`  Session: ${new Date().toISOString()}`);
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