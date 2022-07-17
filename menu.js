const { app, BrowserWindow } = require('electron')
const logger = require('./log.js')
const { dialog } = require('electron')
const { processFile } = require('./import.js')
const { createSettingsWindow } = require('./settingsWindow.js')
const { printPage } = require('./print.js')

const menuTemplate = [{
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
      printPage()
    }
  }, {
    label: 'Load First File',
    accelerator: 'CmdOrCtrl+1',
    click: () => {
      logger.info('Load First File')
      const files = dialog.showOpenDialogSync({ filters: [{ name: 'Data Logger Supported File Types', extensions: ['txt', 'csv', 'xlsx'] }], properties: ['openFile'] })
      if (files !== undefined) {
        logger.info('opening ' + files[0])
        logger.info('typeof ' + typeof (files[0]))
        processFile(1, files[0])
      }
    }
  }, {
    label: 'Load Second File',
    accelerator: 'CmdOrCtrl+2',
    click: () => {
      logger.info('Load Second File')
      const files = dialog.showOpenDialogSync({ filters: [{ name: 'Data Logger Supported File Types', extensions: ['txt', 'csv', 'xlsx'] }], properties: ['openFile'] })
      if (files !== undefined) {
        logger.info('opening ' + files[0])
        logger.info('typeof ' + typeof (files[0]))
        processFile(2, files[0])
      }
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
      createSettingsWindow()
    }
  }]
}
]

module.exports = {
  menuTemplate
}
