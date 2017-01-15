let moment = require('moment')
const logger = require('winston')

let formatDate = function (dateString) {
  let x = moment(dateString, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY H:mm', 'YYYY-MM-DD HH:mm:ss'])
  if (!x.isValid()) {
    logger.debug('doing non dd/mm: ', dateString)
    x = moment(dateString)
    logger.debug('converted to', x)
  }
  return x
}

let getAverageFromArray = function (a) {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += parseInt(a[i], 10)
  }
  return (sum / a.length).toFixed(2)
}

function matchInStringArray (item, stringArray) {
  for (let index in stringArray) {
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
