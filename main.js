const electron = require('electron');
const app = electron.app;  // Module to control application life.
//const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const globalShortcut = electron.globalShortcut;
const dialog = require('electron').dialog;
const fs = require('fs');
const logger = require('winston');
const ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var settingsWindow = null;

var printInProgress = false;

var defaultBounds = { width: 1024, height: 768 };
var currentBounds = defaultBounds;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  globalShortcut.unregisterAll();
  if (process.platform != 'darwin') {
    app.quit();
  }
});
var printPage = function() {
    mainWindow.webContents.printToPDF({ pageSize: 'A3', landscape: true}, function(error, data) {
        if (error) throw error;
        var file = dialog.showSaveDialog(mainWindow, { filters: [ { name: 'PDF', extensions: ['pdf'] }]});
        if(file) {
            fs.writeFile(file, data, function(error) {
              if (error)
                throw error;
              logger.info("Wrote PDF successfully.");
            });
        }
    });
}

ipcMain.on('resising-finished', function() {
    console.log('resizing finished');
    if(printInProgress) {
        printPage();
        printInProgress = false;
        console.log('resizing back to', currentBounds);
        mainWindow.setBounds( currentBounds );
    }
});

ipcMain.on('print-page', function() {
    printInProgress = true;
    currentBounds = mainWindow.getBounds();
    console.log('current size', currentBounds);
    if(currentBounds.width == defaultBounds.width && currentBounds.height == defaultBounds.height) {
        printPage();
        printInProgress = false;
    }
    else {
        //resize to fit on page and print once graph etc has finished resising.
        defaultBounds.x = currentBounds.x;
        defaultBounds.y = currentBounds.y;
        console.log('resizing to', defaultBounds);
        mainWindow.setBounds( defaultBounds );
    }
});

ipcMain.on('open-settings-window', function () {
    if (settingsWindow) {
        return;
    }

    settingsWindow = new BrowserWindow({
        frame: false,
        height: 350,
        resizable: false,
        width: 400
    });
    settingsWindow.loadURL('file://' + __dirname + '/settings.html');
    //settingsWindow.webContents.openDevTools();
    settingsWindow.show();

    settingsWindow.on('closed', function () {
        settingsWindow = null;
    });
});

ipcMain.on('close-settings-window', function (event, config) {
        logger.info('close-settings-window');
    if (settingsWindow) {
            logger.info('settingsWindow closed');
            var webContents = mainWindow.webContents;
            webContents.send('reprocess', config);
            settingsWindow.close();
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow( defaultBounds );

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    if (settingsWindow) {
            settingsWindow.close();
    }
    mainWindow = null;
  });
});
