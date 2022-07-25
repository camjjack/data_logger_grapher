const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const logger = require('./log.js')
const menu = require('./menu.js')
const { closeSettingsWindow } = require('./settingsWindow.js')
const { createWindow } = require('./mainWindow.js')
const { printPage } = require('./print.js')
const { getConfig, setConfig } = require('./configuration.js')
const { reprocess } = require('./import.js')

Menu.setApplicationMenu(Menu.buildFromTemplate(menu.menuTemplate))

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on('print-page', () => {
  printPage()
})

const handleCloseSettingsWindow = (event) => {
  logger.info('close-settings-window')
  closeSettingsWindow()
  reprocess()
}

async function handleGetConfig (event) {
  return getConfig()
}

async function handleSetConfig (event, config) {
  logger.info('Setting Config: ' + config)
  setConfig(config)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('getConfig', handleGetConfig)
  ipcMain.handle('setConfig', handleSetConfig)
  ipcMain.on('closeSettingsWindow', handleCloseSettingsWindow)
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
