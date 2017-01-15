var moment = require('moment')
const logger = require('winston')

var formatDate = function (dateString) {
  var x = moment(dateString, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY H:mm', 'YYYY-MM-DD HH:mm:ss'])
  if (!x.isValid()) {
    logger.debug('doing non dd/mm: ', dateString)
    x = moment(dateString)
    logger.debug('converted to', x)
  }
  return x
}

var getAverageFromArray = function (a) {
  var sum = 0
  for (var i = 0; i < a.length; i++) {
    sum += parseInt(a[i], 10)
  }
  return (sum / a.length).toFixed(2)
}

function matchInStringArray (item, stringArray) {
  for (var index in stringArray) {
    if (item.toLowerCase().match(stringArray[index].toLowerCase())) {
      return true
    }
  }
  return false
}

module.exports = {
  formatDate: formatDate,
  getAverageFromArray: getAverageFromArray,
  matchInStringArray: matchInStringArray
}
