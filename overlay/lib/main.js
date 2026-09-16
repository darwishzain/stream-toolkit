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
        if(typeof socialrotation == "function")
        {
            socialrotation();
        }
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
loadconfig()