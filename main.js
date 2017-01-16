const electron = require('electron')
const app = electron.app  // Module to control application life.
const BrowserWindow = electron.BrowserWindow  // Module to create native browser window.
const globalShortcut = electron.globalShortcut
const dialog = require('electron').dialog
const fs = require('fs')
const logger = require('winston')
const path = require('path')
const ipcMain = electron.ipcMain

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null
let settingsWindow = null
let printInProgress = false
let defaultBounds = { width: 1024, height: 768 }
let currentBounds = defaultBounds

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
let printPage = function () {
  mainWindow.webContents.printToPDF({landscape: true}, (error, data) => {
    if (error) {
      throw error
    }
    let file = dialog.showSaveDialog(mainWindow, {filters: [{name: 'PDF', extensions: ['pdf']}]})
    if (file) {
      fs.writeFile(file, data, (error) => {
        if (error) {
          throw error
        }
        logger.info('Wrote PDF successfully.')
      })
    }
  })
}

ipcMain.on('resising-finished', () => {
  if (printInProgress) {
    printPage()
    printInProgress = false
    mainWindow.setBounds(currentBounds)
  }
})

ipcMain.on('print-page', () => {
  printInProgress = true
  currentBounds = mainWindow.getBounds()
  if (currentBounds.width === defaultBounds.width && currentBounds.height === defaultBounds.height) {
    printPage()
    printInProgress = false
  } else {
    // resize to fit on page and print once graph etc has finished resising.
    defaultBounds.x = currentBounds.x
    defaultBounds.y = currentBounds.y
    mainWindow.setBounds(defaultBounds)
  }
})

ipcMain.on('open-settings-window', () => {
  if (settingsWindow) {
    return
  }

  settingsWindow = new BrowserWindow({
    frame: false,
    height: 350,
    resizable: false,
    width: 400
  })
  settingsWindow.loadURL('file://' + path.join(__dirname, '/settings.html'))
  // settingsWindow.webContents.openDevTools()
  settingsWindow.show()

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })
})

ipcMain.on('close-settings-window', (event, config) => {
  logger.info('close-settings-window')
  if (settingsWindow) {
    logger.info('settingsWindow closed')
    let webContents = mainWindow.webContents
    webContents.send('reprocess', config)
    settingsWindow.close()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  // Create the browser window.
  mainWindow = new BrowserWindow(defaultBounds)

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + path.join(__dirname, '/index.html'))

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    if (settingsWindow) {
      settingsWindow.close()
    }
    mainWindow = null
  })
})
