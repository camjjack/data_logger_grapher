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

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  globalShortcut.unregisterAll();
  if (process.platform != 'darwin') {
    app.quit();
  }
});

ipcMain.on('print-page', function() {
    mainWindow.webContents.printToPDF({ landscape: true}, function(error, data) {
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
  mainWindow = new BrowserWindow({ width: 1024, height: 768 });

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
