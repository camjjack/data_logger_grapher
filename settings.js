/* global noUiSlider, wNumb */
const electron = require('electron')
const configuration = require('./configuration.js')
const ipcRenderer = electron.ipcRenderer
const config = configuration.config
const save = configuration.save

function saveConfig () {
  const pivot = document.getElementById('pivot')
  config.pivot = pivot.value

  const slider = document.getElementById('range')
  const range = slider.noUiSlider.get()
  config.minTemp = parseInt(range[0])
  config.maxTemp = parseInt(range[1])

  const temperature = document.getElementById('temperature')
  config.displayTemp = temperature.checked

  const humitity = document.getElementById('humitity')
  config.displayHumidity = humitity.checked
  save(config)

  ipcRenderer.send('close-settings-window', config)
}

document.addEventListener('DOMContentLoaded', () => {
  const pivot = document.getElementById('pivot')
  pivot.value = config.pivot

  const slider = document.getElementById('range')
  noUiSlider.create(slider, {
    start: [config.minTemp, config.maxTemp],
    connect: true,
    step: 1,
    range: {
      min: -40,
      max: 40
    },
    format: wNumb({
      decimals: 1
    })
  })

  const temperature = document.getElementById('temperature')
  temperature.checked = config.displayTemp

  const humitity = document.getElementById('humitity')
  humitity.checked = config.displayHumidity
})

module.exports = saveConfig
