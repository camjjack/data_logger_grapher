/* global noUiSlider, wNumb */
const electron = require('electron')
const configuration = require('./configuration.js')
const ipcRenderer = electron.ipcRenderer
var config = configuration.config
var save = configuration.save

function saveConfig () {
  var pivot = document.getElementById('pivot')
  config.pivot = pivot.value

  var slider = document.getElementById('range')
  var range = slider.noUiSlider.get()
  config.minTemp = parseInt(range[0])
  config.maxTemp = parseInt(range[1])

  var temperature = document.getElementById('temperature')
  config.displayTemp = temperature.checked

  var humitity = document.getElementById('humitity')
  config.displayHumidity = humitity.checked
  save(config)

  ipcRenderer.send('close-settings-window', config)
}

document.addEventListener('DOMContentLoaded', function () {
  var pivot = document.getElementById('pivot')
  pivot.value = config.pivot

  var slider = document.getElementById('range')
  noUiSlider.create(slider, {
    start: [config.minTemp, config.maxTemp],
    connect: true,
    step: 1,
    range: {
      'min': -40,
      'max': 40
    },
    format: wNumb({
      decimals: 1
    })
  })

  var temperature = document.getElementById('temperature')
  temperature.checked = config.displayTemp

  var humitity = document.getElementById('humitity')
  humitity.checked = config.displayHumidity
})

module.exports = saveConfig
