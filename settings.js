const electron = require('electron');
const remote = electron.remote;
const configuration = require('./configuration.js');
const ipcRenderer = electron.ipcRenderer;
var config = configuration.config;
var save = configuration.save;

function saveConfig() {

    var pivot = document.getElementById('pivot');
    config.pivot = pivot.value;

    var slider = document.getElementById('range');
    var range = slider.noUiSlider.get();
    config.min_temp = parseInt(range[0]);
    config.max_temp = parseInt(range[1]);

    var temperature = document.getElementById('temperature');
    config.display_temp = temperature.checked;

    var humitity = document.getElementById('humitity');
    config.display_humidity = humitity.checked;
    save(config);
    

    ipcRenderer.send('close-settings-window', config);
}

document.addEventListener('DOMContentLoaded', function () {
    var pivot = document.getElementById('pivot');
    pivot.value = config.pivot;

    var slider = document.getElementById('range');
    noUiSlider.create(slider, {
        start: [config.min_temp, config.max_temp],
        connect: true,
        step: 1,
        range: {
         'min': -40,
         'max': 40
        },
        format: wNumb({
         decimals: 1
        })
    });

  var temperature = document.getElementById('temperature');
  temperature.checked = config.display_temp;

  var humitity = document.getElementById('humitity');
  humitity.checked = config.display_humidity;
});
