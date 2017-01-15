/* global noUiSlider, wNumb */
const electron = require('electron')
const configuration = require('./configuration.js')
const ipcRenderer = electron.ipcRenderer
let config = configuration.config
let save = configuration.save

function saveConfig () {
  let pivot = document.getElementById('pivot')
  config.pivot = pivot.value

  let slider = document.getElementById('range')
  let range = slider.noUiSlider.get()
  config.minTemp = parseInt(range[0])
  config.maxTemp = parseInt(range[1])

  let temperature = document.getElementById('temperature')
  config.displayTemp = temperature.checked

  let humitity = document.getElementById('humitity')
  config.displayHumidity = humitity.checked
  save(config)

  ipcRenderer.send('close-settings-window', config)
}

document.addEventListener('DOMContentLoaded', () => {
  let pivot = document.getElementById('pivot')
  pivot.value = config.pivot

  let slider = document.getElementById('range')
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

  let temperature = document.getElementById('temperature')
  temperature.checked = config.displayTemp

  let humitity = document.getElementById('humitity')
  humitity.checked = config.displayHumidity
})

module.exports = saveConfig
