import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  // Example: sendMessage: (message: string) => ipcRenderer.send('message', message),
  // Example: onMessage: (callback: (event: Electron.IpcRendererEvent, data: string) => void) => 
  //   ipcRenderer.on('message', callback)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer process only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = api
}
