const settings = require('electron-settings')
const logger = require('winston')

settings.defaults({
  'config': {
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
var config = settings.getSync('config')

logger.debug('config')
logger.debug(config)

var save = function (c) {
  logger.debug('saving config: ')
  logger.debug(c)
  settings.setSync('config', c)
}
module.exports = {
  config: config,
  save: save
}
