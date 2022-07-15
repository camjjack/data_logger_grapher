const settings = require('electron-settings')
const logger = require('winston')

settings.defaults({
  config: {
    pivot: 3.0,
    maxTemp: 10.0,
    minTemp: -25.0,
    displayTemp: true,
    displayHumidity: true
  }
})

if (!settings.hasSync('config')) {
  settings.resetToDefaultsSync()
}
const config = settings.getSync('config')

logger.debug('config')
logger.debug(config)

const save = (c) => {
  logger.debug('saving config: ')
  logger.debug(c)
  settings.setSync('config', c)
}
module.exports = {
  config,
  save
}
