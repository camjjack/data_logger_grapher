'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const globalShortcut = electron.globalShortcut;
const dialog = require('electron').dialog;
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  globalShortcut.unregisterAll();
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Register a 'CommandOrControl+P' shortcut listener.
  var ret = globalShortcut.register('CommandOrControl+P', function() {
    mainWindow.webContents.printToPDF({ landscape: true}, function(error, data) {
        if (error) throw error;
        var file = dialog.showSaveDialog(mainWindow, { filters: [ { name: 'PDF', extensions: ['pdf'] }]});
        if(file) {
            fs.writeFile(file, data, function(error) {
              if (error)
                throw error;
              console.log("Write PDF successfully.");
            });
        }
    });
  });

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
    mainWindow = null;
  });
});
