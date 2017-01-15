const electron = require('electron')
const ipcRenderer = electron.ipcRenderer
const app = electron.app  // Module to control application life.
const BrowserWindow = require('electron').remote.BrowserWindow
const logger = require('winston')

var menuTemplate = [{
  label: 'File',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: () => {
      BrowserWindow.getFocusedWindow().webContents.reloadIgnoringCache()
    }
  }, {
    label: 'Toggle DevTools',
    accelerator: 'Alt+CmdOrCtrl+I',
    click: () => {
      BrowserWindow.getFocusedWindow().toggleDevTools()
    }
  }, {
    label: 'Print',
    accelerator: 'CmdOrCtrl+P',
    click: () => {
      ipcRenderer.send('print-page')
    }
  }, {
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: () => {
      app.quit()
    }
  }]
}, {
  label: 'Config',
  submenu: [{
    label: 'Settings',
    accelerator: 'CmdOrCtrl+S',
    click: () => {
      logger.info('opening window')
      ipcRenderer.send('open-settings-window')
    }
  }]
}
]

module.exports = {
  menuTemplate: menuTemplate
}
