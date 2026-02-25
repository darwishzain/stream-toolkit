from cProfile import label

import streamlit as st
import streamlit.components.v1 as stcomps
import glob,os,subprocess,platform
SERVER_URL = ""
def copylink(text):
    js_code = f"""
        <script>
        navigator.clipboard.writeText("{text}").then(() => {{
            console.log('Copied to clipboard');
        }});
        </script>
    """
    stcomps.html(js_code, height=0)

def toast(message):
    st.toast(message)
st.title("Stream Toolkit Dashboard")
st.markdown(
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">',
    unsafe_allow_html=True
)
port = st.text_input("Server Port",value="7070", placeholder="Enter port number to start server", key="port")
if st.button("🚀 Launch in New Terminal"):
    # Ensure the directory exists
    if not os.path.exists("./browser"):
        os.makedirs("./browser")

    cwd = os.path.abspath(".")
    cmd_python = f"python -m http.server {port}"

    if platform.system() == "Windows":
        # 'start' opens a new cmd window
        # /K keeps the window open even if the command fails for debugging
        subprocess.Popen(f'start cmd /K "title FileServer_{port} && cd /d {cwd} && {cmd_python}"', shell=True)
    elif platform.system() == "Darwin":  # macOS
        # Uses AppleScript to tell Terminal to open and run the command
        cmd = f'tell application "Terminal" to do script "cd {cwd} && {cmd_python}"'
        subprocess.Popen(["osascript", "-e", cmd])
    else:  # Linux
        # Tries to find common terminal emulators
        subprocess.Popen(["gnome-terminal", "--", "bash", "-c", f"cd {cwd} && {cmd_python}; exec bash"])
    SERVER_URL = f"http://localhost:{port}"
    st.success(f"New terminal window opened for port {port}!")
if glob.glob(os.path.join("browser", "*.html")):
    for file in glob.glob(os.path.join("browser", "*.html")):
        browsername = os.path.basename(file).split(".")[0]
        browserpath = os.path.abspath(file)
        with st.container(border=True):
            col1, colcopy, colopen = st.columns([2, 5,2])
            with col1:
                st.markdown(f"**{browsername}**")
            with colcopy:
                st.code(f"{browserpath}", language=None)
            with colopen:
                external_link = f"{SERVER_URL}/{browsername}.html"
                openbtn = f"""
                    <a href="http://127.0.0.1:{port}/browser/{browsername}.html" target="_blank" style="
                        text-decoration: none;
                        color: white;
                        border: white 1px solid;
                        padding: 10px 20px;
                        border-radius: 10px;
                        display: inline-block;
                    ">{browsername} <i class="bi bi-box-arrow-up-right"></i></a>
                """
                st.markdown(openbtn, unsafe_allow_html=True)