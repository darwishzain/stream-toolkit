user = null;
async function loadconfig() {
    try {
        const response = await fetch('user.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        user = await response.json();
        const activetheme = user.theme || 'default';
        document.body.setAttribute('th-theme',activetheme);
        if(typeof socialrotation == "function")
        {
            socialrotation();
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