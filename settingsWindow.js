const { BrowserWindow } = require('electron')
const path = require('path')
const logger = require('./log.js')
let settingsWindow = null

const createSettingsWindow = () => {
  if (settingsWindow) {
    return
  }

  settingsWindow = new BrowserWindow({
    frame: false,
    height: 350,
    resizable: false,
    width: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  settingsWindow.loadFile('settings.html')
  //  settingsWindow.webContents.openDevTools()

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
}

const closeSettingsWindow = (event) => {
  logger.info('close-settings-window')
  if (settingsWindow) {
    logger.info('settingsWindow closed')
    settingsWindow.close()
  }
}

module.exports = {
  createSettingsWindow,
  closeSettingsWindow
}
