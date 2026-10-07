const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');
const { fileURLToPath } = require('url');
const tmiJS = require('tmi.js');
const { Innertube, UniversalCache } = require('youtubei.js');
const ComfyJS = require('comfy.js');

const PORT = process.env.PORT || 3000;
const isPackaged = process.pkg ? true : false;
const executionDir = isPackaged
    ? path.dirname(process.execPath)
    : __dirname;
const CONFIG_PATH = isPackaged
    ? path.join(path.dirname(process.execPath), 'overlay.conf')
    : path.join(__dirname, '../overlay.conf');
const EXAMPLE_CONFIG_PATH = `${CONFIG_PATH}.example`;
const homePath = path.join(__dirname, '.');
const overlays = fs.readdirSync(homePath).filter(
    file => file.endsWith('.html')
    && file !== 'index.html'
    && file !== 'edit.html');

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        try {
            if (fs.existsSync(EXAMPLE_CONFIG_PATH)) {
                fs.copyFileSync(EXAMPLE_CONFIG_PATH, CONFIG_PATH);
                console.log('[Config] Created overlay.conf from overlay.conf.example');
            } else {
                console.warn('[Config] Example config file not found:', EXAMPLE_CONFIG_PATH);
            }
        } catch (err) {
            console.error('[Config] Failed to create overlay.conf:', err);
        }
    }
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
            return JSON.parse(raw);
        } catch (err) {
            console.error('[Config] Error parsing config file:', err);
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
function sendAlert(type, user, details, message = "") {
    io.emit('overlay-alert', {
        type,
        user,
        details,
        message,
        timestamp: Date.now()
    });
}
if(config.twitchchannel)
{
    ComfyJS.onConnected = (address, port) => {
        console.log(`[Twitch] Successfully connected to Twitch chat @${config.twitchchannel} at ${address}:${port}`);
    };
    ComfyJS.onDisconnect = () => {
        console.log("[Twitch] Disconnected from Twitch chat.");
    };
    ComfyJS.onChat = (user,message,flags,self,extra) => {
        io.emit('chatMessage',{
            platform: 'twitch',
            user: extra.displayName || user,
            color: user.color || "#9146FF",
            message: message,
            avatar: null
        });
    }
    ComfyJS.onSub = (user, msg, subTier) => sendAlert('sub', user, `Subscribed (${subTier.plan})`, msg);
    ComfyJS.onResub = (user, msg, streak, total) => sendAlert('resub', user, `Resub x${total}`, msg);
    ComfyJS.onRaid = (user, viewers) => sendAlert('raid', user, `Raid with ${viewers} viewers`);
    ComfyJS.onReward = (user, title, cost, msg) => sendAlert('reward', user, `Redeemed: ${title}`, msg);
    ComfyJS.Init(config.twitchchannel);
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
    console.log(`  Config:`);
    console.log(`\t${localUrl}/api/config`);
    console.log(`\t${CONFIG_PATH}`);
    console.log(`==================================================\n`);
});
process.on('SIGINT', () => {
    console.log('Received SIGINT. Closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
});