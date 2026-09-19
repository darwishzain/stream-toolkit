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
        const activetheme = config.theme || 'default';
        document.body.setAttribute('th-theme',activetheme);
        
        if(typeof socialticker == "function")
        {
            socialticker();
        }
        if (typeof initcomfy === "function") {
            initcomfy();
        }

        if (typeof tmichat === "function") {
            tmichat();
        }

        if (typeof initmissions === "function")
        {
            initmissions();
        }
    } catch (error) {
        console.error("One of the files failed to load(", error, ")");
    }
}
if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadconfig);
} else {
    loadconfig();
}