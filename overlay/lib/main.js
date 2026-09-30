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
config = null;
async function loadconfig() {
    try {
        const response = await fetch('overlay.config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        config = await response.json();
        if(!config)
        {
            errorMessage("Missing configuration file.");
            return;
        }

        const {colors,typography} = config.theme;
        const root = document.documentElement;
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
        if(typeof socialticker == "function")
        {
            if(!config['social-ticker'])
            {
                errorMessage("Missing configuration for Social Ticker.");
                return;
            }
            socialticker();
        }
        if (typeof tmichat === "function") {
            if(!config["twitch-chat"])
            {
                errorMessage("Missing configuration for Twitch Chat.");
                return;
            }
            tmichat();
        }
        if (typeof wavingflag === "function")
        {
            if(!config['waving-flag'])
            {
                errorMessage("Missing configuration for Waving Flag.");
                return;
            }
            wavingflag();
        }
        //initcomfy
        //initmission
    } catch (error) {
        console.error("One of the files failed to load(", error, ")");
    }
}
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadconfig);
} else {
    loadconfig();
}