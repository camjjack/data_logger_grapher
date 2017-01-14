var logger = require('winston');

logger.add(logger.transports.File, {filename: 'somefile.log', level: 'debug'});
//logger.add(logger.transports.Console, {level: 'error'});
module.exports = logger;