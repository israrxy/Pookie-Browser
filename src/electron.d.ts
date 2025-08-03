export interface ElectronAPI {
  // Add any Electron API methods you want to expose here
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
