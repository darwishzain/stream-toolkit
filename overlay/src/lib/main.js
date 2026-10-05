const head = document.head;
const styleLink = [
    "./lib/style.css",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css",
    "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css"
];
styleLink.forEach(link => {
    const style = document.createElement('link');
    style.href = link;
    style.rel = 'stylesheet';
    head.appendChild(style);
});

function errorMessage(message, fix = null){
    console.error(message);
    const body = document.body;
    const error = document.createElement('div');
    error.textContent = message;
    error.className = 'th-bg';
    error.style = `
        top:10px;
        margin: 2px auto;
        width: 80%;
        z-index: 9999;
        color: red;
        text-align: center;
        padding: 10px;
        border: 1px solid red;
    `;
    body.prepend(error);
}
function setTheme(config){
    const root = document.documentElement;
    const {colors,typography,aesthetics} = config.theme;

    root.setAttribute('th-theme',config.theme.id);
    root.style.setProperty('--th-accent', colors.primary);
    root.style.setProperty('--th-secondary', colors.secondary);
    root.style.setProperty('--th-bg', colors.background);
    root.style.setProperty('--th-fg', colors.text);
    root.style.setProperty('--th-glow', colors.glow);
    if (typography) {
        root.style.setProperty('--th-font-family', typography.fontFamily);
        root.style.setProperty('--th-font-size-base', typography.fontSizeBase);
    }
    root.setAttribute('data-aesthetic', aesthetics.preset);
    const fx = aesthetics.effects;
    if (!fx) return;
    // Set CSS properties for fine-grained effect controls
    if (fx.glow?.enabled) {
        root.style.setProperty('--th-glow-blur', fx.glow.blur);
    }

    if (fx.scanlines?.enabled) {
        root.style.setProperty('--th-scanline-opacity', fx.scanlines.opacity.toString());
    }

    if (fx.glassmorphism?.enabled) {
        root.style.setProperty('--th-glass-blur', fx.glassmorphism.blur);
        root.style.setProperty('--th-glass-opacity', fx.glassmorphism.opacity.toString());
    }
}
config = null;
async function initializeOverlay(){
    try{
        const confResponse = await fetch('/api/config');
        config = await confResponse.json();
        //Theme
        setTheme(config);
        //Function key mapping
        const modules = [
            { key: 'social-ticker', fn: typeof socialticker === 'function' ? socialticker : null },
            { key: 'twitch-chat',   fn: typeof tmichat === 'function' ? tmichat : null },
            { key: 'chatbox',       fn: typeof chat === 'function' ? chat : null },
            { key: 'waving-flag',   fn: typeof wavingflag === 'function' ? wavingflag : null }
        ];

        for (const { key, fn } of modules) {
            if (!fn) continue; // Skip if function isn't present in this HTML file
            if (!config[key]) {
                errorMessage(`Missing configuration for ${key}.`);
                continue;
            }
            fn();
        }
    }
    catch(error)
    {
        console.error("One of the files failed to load(", error, ")");
    }
}
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initializeOverlay);
} else {
    initializeOverlay();
}
