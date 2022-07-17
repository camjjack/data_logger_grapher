const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('getConfig'),
  setConfig: (config) => ipcRenderer.invoke('setConfig', config),
  closeSettingsWindow: () => ipcRenderer.send('closeSettingsWindow'),
  resisingFinished: () => ipcRenderer.send('resising-finished'),
  handleDoGraph: (callback) => ipcRenderer.on('update-graph', callback)
})
