const { ipcMain, dialog } = require('electron')
const fs = require('fs')
const { getWindow, getWebContents, getDefaultBounds, getBounds, setBounds } = require('./mainWindow.js')
const logger = require('./log.js')

let printInProgress = false

const printPage = function () {
  printInProgress = true
  const currentBounds = getBounds()
  const defaultBounds = getDefaultBounds()
  if (currentBounds.width === defaultBounds.width && currentBounds.height === defaultBounds.height) {
    getWebContents().printToPDF({ landscape: true }).then(data => {
      const file = dialog.showSaveDialogSync(getWindow(), { filters: [{ name: 'PDF', extensions: ['pdf'] }] })
      if (file) {
        fs.writeFile(file, data, (error) => {
          if (error) {
            throw error
          }
          logger.info('Wrote PDF successfully.')
        })
      }
    }).catch(error => {
      console.log(error)
    })
    printInProgress = false
  } else {
    logger.info('Error PDF successfully.')
    // resize to fit on page and print once graph etc has finished resising.
    defaultBounds.x = currentBounds.x
    defaultBounds.y = currentBounds.y
    setBounds(defaultBounds)
  }
}

ipcMain.on('resising-finished', () => {
  if (printInProgress) {
    printPage()
  }
})

module.exports = {
  printPage
}
