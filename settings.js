const electron = require('electron');
const remote = electron.remote;
const configuration = require('./configuration.js');
const ipcRenderer = electron.ipcRenderer;
var config = configuration.config;

function saveConfig() {

    var pivot = document.getElementById('pivot');
    config.set('pivot', pivot.value);

    var slider = document.getElementById('range');
    var range = slider.noUiSlider.get();
    config.set('min_temp', parseInt(range[0]));
    config.set('max_temp', parseInt(range[1]));

    var temperature = document.getElementById('temperature');
    config.set('display_temp', temperature.checked);

    var humitity = document.getElementById('humitity');
    config.set('display_humidity', humitity.checked);

    ipcRenderer.send('close-settings-window', config.get());
}

document.addEventListener('DOMContentLoaded', function () {
    var pivot = document.getElementById('pivot');
    pivot.value = config.get('pivot');

    var slider = document.getElementById('range');
    noUiSlider.create(slider, {
        start: [config.get('min_temp'), config.get('max_temp')],
        connect: true,
        step: 1,
        range: {
         'min': -20,
         'max': 40
        },
        format: wNumb({
         decimals: 1
        })
    });

  var temperature = document.getElementById('temperature');
  temperature.checked = config.get('display_temp');

  var humitity = document.getElementById('humitity');
  humitity.checked = config.get('display_humidity');
});
