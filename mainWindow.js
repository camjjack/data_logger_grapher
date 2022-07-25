const { BrowserWindow } = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null
const defaultBounds = { width: 1024, height: 768 }
let currentBounds = defaultBounds

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow(Object.assign({}, defaultBounds, { webPreferences: { preload: path.join(__dirname, 'preload.js') } }))

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  //  mainWindow.webContents.openDevTools()
}

function getWebContents () {
  return mainWindow.webContents
}

const getDefaultBounds = () => {
  return defaultBounds
}
const getBounds = () => {
  return currentBounds
}
const setBounds = (newBounds) => {
  currentBounds = newBounds
}
const getWindow = () => {
  return mainWindow
}

module.exports = {
  createWindow,
  getWebContents,
  getDefaultBounds,
  getWindow,
  getBounds,
  setBounds
}
