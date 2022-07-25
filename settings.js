/* global noUiSlider, wNumb */
const slider = document.getElementById('range')
const temperature = document.getElementById('temperature')
const pivot = document.getElementById('pivot')
const humitity = document.getElementById('humitity')
const detectCoolingViaHumidityInc = document.getElementById('detectCoolingViaHumidityInc')

/* eslint-disable no-unused-vars */
const saveConfig = () => {
  console.log('saving: ')
  const config = {}
  config.pivot = parseInt(pivot.value)

  const range = slider.noUiSlider.get()
  config.minTemp = parseInt(range[0])
  config.maxTemp = parseInt(range[1])

  config.displayTemp = temperature.checked

  config.displayHumidity = humitity.checked
  config.detectCoolingViaHumidityInc = detectCoolingViaHumidityInc.checked

  console.log('saving: ' + config)
  window.electronAPI.setConfig(config)
  window.electronAPI.closeSettingsWindow()
}
/* eslintenable no-unused-vars */

window.electronAPI.getConfig().then((config) => {
  pivot.value = config.pivot

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
  temperature.checked = config.displayTemp
  humitity.checked = config.displayHumidity
  detectCoolingViaHumidityInc.checked = config.detectCoolingViaHumidityInc
})
