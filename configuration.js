const Store = require('electron-store')
const logger = require('./log.js')

const schema = {
  pivot: {
    type: 'number',
    maximum: 100,
    minimum: -40,
    default: 3.0
  },
  maxTemp: {
    type: 'number',
    maximum: 100,
    minimum: -40,
    default: 10
  },
  minTemp: {
    type: 'number',
    maximum: 100,
    minimum: -40,
    default: -25
  },
  displayTemp: {
    type: 'boolean',
    default: true
  },
  displayHumidity: {
    type: 'boolean',
    default: true
  }
}
const store = new Store({ schema })

const setConfig = (config) => {
  logger.debug('saving config')
  store.set(config)
}

const getConfig = () => {
  logger.debug('getting config')
  return store.get()
}
module.exports = {
  setConfig,
  getConfig
}
