import { app, BrowserWindow } from "electron";
import path from "node:path";
process.env.DIST_ELECTRON = path.join(__dirname, "..");
process.env.DIST = path.join(process.env.DIST_ELECTRON, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST_ELECTRON, "../public");
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // Use pluginOptions.nodeIntegration, please check the plugin documentation
      // https://github.com/electron-vite/vite-plugin-electron/blob/main/README.md#plugin-options
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true
      // Enable webview tag
    }
  });
  if (app.isPackaged) {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  } else {
    const url = `http://localhost:${process.env.PORT || 5173}`;
    win.loadURL(url);
    win.webContents.openDevTools();
  }
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
