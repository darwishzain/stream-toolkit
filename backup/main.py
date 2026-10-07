import sys,json,os,pyperclip,shutil,webbrowser,time
import http.server,socketserver,threading
import obsws_python as obs
from pathlib import Path
import webbrowser
from PySide6.QtWidgets import (QApplication, QMainWindow, QPushButton, QTabWidget, QWidget, QLabel)
from PySide6.QtWidgets import QHBoxLayout, QVBoxLayout,QFrame,QMenu
from PySide6.QtWidgets import QTextEdit,QLineEdit,QListWidget,QComboBox,QTableWidget,QTableWidgetItem
from PySide6.QtCore import QProcess, QUrl
from PySide6.QtGui import QClipboard

def reloadapp():
    print("Reloading App...")
    python = sys.executable
    os.execl(python, python, * sys.argv)

def openjson(source):
    try:
        with open(source, 'r') as j:
            return json.load(j)
    except FileNotFoundError:
        return "Error: The file was not found."
    except json.JSONDecodeError:
        return "Error: Failed to decode JSON. Check the file format."

def writejson(source,data):
    try:
        with open(source,'w') as j:
            json.dump(data,j,indent=4)
    except FileNotFoundError:
        return "Error: The file was not found."
    except json.JSONDecodeError:
        return "Error: Failed to decode JSON. Check the file format."

def openlink(link):
    webbrowser.open(str(link))

def runserver(PORT):
    handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Server started at localhost:{PORT}")
        httpd.serve_forever()

config = openjson('config.json')
if not config["server"]:
    port = int("8080")
else:
    port = int(config["server"])
class OverlayManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Stream Overlay Manager")
        self.resize(600, 500)
        self.tabs = QTabWidget()
        self.setCentralWidget(self.tabs)

        self.config = config
        if os.path.exists(self.config["user"]):
            self.userdata = openjson(self.config['user'])
        else:
            try:
                # create user config(copy example and paste),update user config path, write to config
                userfile_c = 'example/user.json'
                userfile_p = 'browser/user.json'
                shutil.copy2(userfile_c,userfile_p)
                self.config['user'] = userfile_p
                writejson('config.json',self.config)#Update config
            except Exception as e:
                print(f"Error copying file: {e}")
        #self.menuBar().addAction("&Home", self.hometab)
        #self.menuBar().addAction("&Edit", self.edit)
        self.menuBar().addAction("&Reload", reloadapp)
        self.userjson = "browser/user.json"
        self.hometab()

        self.edit_l = QVBoxLayout()
        self.edit_t = QWidget()
        self.edit_t.setLayout(self.edit_l)
        self.edit()
    def hometab(self):
        layout = QVBoxLayout()
        hometab = QWidget()
        hometab.setLayout(layout)
        #* Server 
        server_b = QHBoxLayout()
        server_b.addWidget(QLabel(f"Server: {port}"))
        openserver_btn = QPushButton("Navigate to browser overlay")
        openserver_btn.clicked.connect(lambda checked,link=f"http://127.0.0.1:{port}/browser":openlink(link))
        server_b.addWidget(openserver_btn)
        layout.addLayout(server_b)
        for overlay in config['overlays']:
            print(overlay)

        self.tabs.addTab(hometab,"Home")
    def edit(self):
        userdata = self.userdata
        #* General
        self.edit_l.addWidget(QLabel("User & Theme"))
        self.username_input = QLineEdit(userdata["username"])
        self.edit_l.addWidget(self.username_input)
        self.theme_input = QComboBox()
        self.theme_input.addItems(config["themes"])
        if userdata["theme"] != "":
            self.theme_input.setCurrentIndex(self.theme_input.findText(userdata["theme"]))
        else:
            self.theme_input.setCurrentIndex(-1)
        self.edit_l.addWidget(self.theme_input)
        self.general_btn = QPushButton("Update")
        self.general_btn.clicked.connect(self.updategeneral)#TODO Fix then add function
        self.edit_l.addWidget(self.general_btn)
        self.edit_l.addWidget(QFrame(frameShape=QFrame.HLine, frameShadow=QFrame.Sunken))
        #* Social Media Icon !KIV
        self.edit_l.addWidget(QLabel("Socials"))
        self.socials_input = QListWidget()
        for platform, icon in userdata["socials"].items():
            # Format the string exactly how you want it to look
            display_text = f"{platform}: {icon}" 
            self.socials_input.addItem(display_text)
        self.edit_l.addWidget(self.socials_input)
        self.edit_l.addWidget(QFrame(frameShape=QFrame.HLine, frameShadow=QFrame.Sunken))
        #* Missions
        editmission = QVBoxLayout()
        editmission.addWidget(QLabel("Missions"))
        self.missions = QTableWidget()
        self.missions.setColumnCount(4)
        self.missions.setRowCount(len(userdata["missions"]["items"]))
        self.missions.setHorizontalHeaderLabels(["Mission", "Status","Reward","Remove"])
        for m in range(len(userdata["missions"]["items"])):
            self.missions.setItem(m,0,QTableWidgetItem(userdata["missions"]["items"][m][0]))#* Mission Name
            #self.missions.setItem(m,1,QTableWidgetItem(str("status")))#* Mission Status
            if userdata["missions"]["items"][m][1] == 0:
                mupdate_b = QPushButton("Incomplete")
            else:
                mupdate_b = QPushButton("Complete")
            mupdate_b.clicked.connect(lambda checked, x=m: self.mission_update(x))
            self.missions.setCellWidget(m,1,mupdate_b)
            self.missions.setItem(m,2,QTableWidgetItem(userdata["missions"]["items"][m][2]))
            mremove_b = QPushButton("-")
            mremove_b.clicked.connect(lambda checked, x=m: self.mission_remove(x))
            self.missions.setCellWidget(m,3,mremove_b)
        self.missions.resizeColumnsToContents()
        editmission.addWidget(self.missions,1)
        madd_l = QHBoxLayout()
        self.mission_input = QLineEdit()
        self.mission_input.setPlaceholderText("Add Mission")
        madd_l.addWidget(self.mission_input)
        self.reward_input = QComboBox()
        self.reward_input.addItems(["10", "50", "100", "250", "500", "1000"])
        madd_l.addWidget(self.reward_input)
        self.mission_btn = QPushButton("+")
        self.mission_btn.clicked.connect(self.mission_add)
        madd_l.addWidget(self.mission_btn)

        editmission.addLayout(madd_l)

        self.edit_l.addLayout(editmission)

        self.tabs.addTab(self.edit_t,"Edit")

    def cleartab(self,index):
        currenttab = self.tabs.currentIndex()
        tabwidget = self.tabs.widget(index)
        layout = tabwidget.layout()
        if layout is not None:
            while layout.count():
                item = layout.takeAt(0)
                widget = item.widget()
                if widget is not None:
                    widget.deleteLater()

    def update(self):
        currentindex = self.tabs.currentIndex()
        writejson(config["user"],self.userdata)
        self.cleartab(currentindex)
        self.edit()
        self.tabs.setCurrentIndex(currentindex)

    def updategeneral(self):
        self.userdata["username"] = self.username_input.text()
        self.userdata["theme"] = self.theme_input.currentText()
        self.update()

    def mission_add(self):
        currentindex = self.tabs.currentIndex()
        mission = self.mission_input.text()
        reward = self.reward_input.text()
        status = 0
        add = [mission,status,reward]
        if mission and reward and status:
            self.userdata["mission"]["items"].append(add)
            self.mission_input.clear()
            self.update()
    def mission_remove(self,index):
        del self.userdata["missions"]["items"][index]
        self.update()
    def mission_update(self,index):
        current = self.userdata["missions"]["items"][index][1]
        self.userdata["missions"]["items"][index][1] = 1 - current
        self.update()
    #def open_browser(self):
    #    webbrowser.open(self.url)
#
    #def closeEvent(self, event):
    #    # Stop the server when we close the app
    #    if self.server_process:
    #        self.server_process.terminate()
    #    event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = OverlayManager()
    window.show()
    server_thread = threading.Thread(
        target=runserver, 
        args=(port,), 
        daemon=True
    )
    server_thread.start()
    sys.exit(app.exec())

    #self.port = "7070"
        #self.url = f"http://localhost:{self.port}"

        #self.status_label = QLabel("Server: Off")

        #self.copy_btn = QPushButton("📋 Copy Overlay URL (for OBS)")
        #self.copy_btn.clicked.connect(self.copy_to_clipboard)

        #self.open_btn = QPushButton("🌐 Open Overlay in Browser")
        #self.open_btn.clicked.connect(self.open_browser)

        #layout = QVBoxLayout()
        #layout.addWidget(self.status_label)
        #layout.addWidget(self.copy_btn)
        #layout.addWidget(self.open_btn)

        #container = QWidget()
        #container.setLayout(layout)
        #self.setCentralWidget(container)

        #self.server_process = QProcess(self)
        #self.server_process.start("python3", ["-m", "http.server", self.port])
        #if self.server_process.waitForStarted():
        #    self.status_label.setText(f"✅ Server Live: {self.url}")
        #else:
        #    self.status_label.setText("❌ Server Failed to Start")

        #browseroverlay = QVBoxLayout()
        #layout.addLayout(browseroverlay)
        #for file_path in Path("browser").glob("*.html"):
        #    browserline = QHBoxLayout()
        #    labelbrowser = QLabel(f"📄 {file_path.name}")
        #    browserline.addWidget(labelbrowser)#

            #openbtn = QPushButton(f"Open")
            #openbtn.clicked.connect(lambda _, p=file_path: webbrowser.open(f"{self.url}/browser/{p.name}"))
            #browserline.addWidget(openbtn)#

            #copybtn = QPushButton(f"Copy URL")
            #copybtn.clicked.connect(lambda _, p=file_path: pyperclip.copy(f"{self.url}/browser/{p.name}"))
            #browserline.addWidget(copybtn)
            #browseroverlay.addLayout(browserline)