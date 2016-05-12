const ElectronSettings = require('electron-settings');

var config = new ElectronSettings({debouncedSaveTime: 0});

module.exports = {
    config: config
};
