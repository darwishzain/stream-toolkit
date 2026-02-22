user = null;
async function loadconfig() {
    try {
        const response = await fetch('user.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        user = await response.json();
        //if (user.theme === "light") {
        //    document.documentElement.setAttribute('data-theme', 'light');
        //} else {
        //    document.documentElement.setAttribute('data-theme', 'dark');
        //}
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
    } catch (error) {
        console.error("One of the files failed to load(", error, ")");
    }
}
loadconfig()