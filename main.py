import sys,json,os,pyperclip
from pathlib import Path
import webbrowser
from PySide6.QtWidgets import (QApplication, QMainWindow, QPushButton, QWidget, QLabel)
from PySide6.QtWidgets import QHBoxLayout, QVBoxLayout
from PySide6.QtCore import QProcess, QUrl
from PySide6.QtGui import QClipboard

class OverlayManager(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Stream Overlay Manager")
        self.port = "7070"
        self.url = f"http://localhost:{self.port}"

        self.status_label = QLabel("Server: Off")

        self.copy_btn = QPushButton("📋 Copy Overlay URL (for OBS)")
        self.copy_btn.clicked.connect(self.copy_to_clipboard)

        self.open_btn = QPushButton("🌐 Open Overlay in Browser")
        self.open_btn.clicked.connect(self.open_browser)

        layout = QVBoxLayout()
        layout.addWidget(self.status_label)
        #layout.addWidget(self.copy_btn)
        #layout.addWidget(self.open_btn)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.server_process = QProcess(self)
        self.server_process.start("python3", ["-m", "http.server", self.port])
        if self.server_process.waitForStarted():
            self.status_label.setText(f"✅ Server Live: {self.url}")
        else:
            self.status_label.setText("❌ Server Failed to Start")

        browseroverlay = QVBoxLayout()
        layout.addLayout(browseroverlay)
        for file_path in Path("browser").glob("*.html"):
            browserline = QHBoxLayout()
            labelbrowser = QLabel(f"📄 {file_path.name}")
            browserline.addWidget(labelbrowser)

            openbtn = QPushButton(f"Open")
            openbtn.clicked.connect(lambda _, p=file_path: webbrowser.open(f"{self.url}/browser/{p.name}"))
            browserline.addWidget(openbtn)

            copybtn = QPushButton(f"Copy URL")
            copybtn.clicked.connect(lambda _, p=file_path: pyperclip.copy(f"{self.url}/browser/{p.name}"))
            browserline.addWidget(copybtn)
            browseroverlay.addLayout(browserline)

    def open_browser(self):
        webbrowser.open(self.url)

    def closeEvent(self, event):
        # Stop the server when we close the app
        if self.server_process:
            self.server_process.terminate()
        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = OverlayManager()
    window.show()
    sys.exit(app.exec())