let logger = require('winston')

logger.add(logger.transports.File, {filename: 'somefile.log', level: 'debug'})

module.exports = logger
