import { contextBridge } from "electron";
const api = {
  // Example: sendMessage: (message: string) => ipcRenderer.send('message', message),
  // Example: onMessage: (callback: (event: Electron.IpcRendererEvent, data: string) => void) => 
  //   ipcRenderer.on('message', callback)
};
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = api;
}
