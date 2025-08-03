import { app, BrowserWindow } from 'electron'
import path from 'node:path'

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── main.js
// │ └─┬ preload
// │   └── preload.js
// ├─┬ dist
// │ └── index.html
// │
process.env.DIST_ELECTRON = path.join(__dirname, '..')
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST_ELECTRON, '../public')

let win: BrowserWindow | null

// Remove window list when use `singleWindow: true`
// app.on('browser-window-created', (_, window) => {
//   optimizer.watchWindowShortcuts(window)
// })

// Create the browser window.
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Use pluginOptions.nodeIntegration, please check the plugin documentation
      // https://github.com/electron-vite/vite-plugin-electron/blob/main/README.md#plugin-options
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Enable webview tag
    },
  })

  // and load the index.html of the app.
  if (app.isPackaged) {
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  } else {
    const url = `http://localhost:${process.env.PORT || 5173}`
    win.loadURL(url)
    // Open the DevTools.
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
