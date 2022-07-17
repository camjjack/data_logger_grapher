const winston = require('winston')
const { combine, timestamp, json } = winston.format

const logger = winston.createLogger({
  level: 'debug',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.File({
      filename: 'debug.log'
    })
  ]
})

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

module.exports = logger
