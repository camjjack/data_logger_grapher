let moment = require('moment')
const logger = require('winston')

let formatDate = (dateString) => {
  let x = moment(dateString, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY H:mm', 'YYYY-MM-DD HH:mm:ss'])
  if (!x.isValid()) {
    logger.debug('doing non dd/mm: ', dateString)
    x = moment(dateString)
    logger.debug('converted to', x)
  }
  return x
}

let getAverageFromArray = (arr, radix = 10, fractionDigits = 2) => {
  let sum = arr.reduce((accumulator, currentValue) => {
    return accumulator + parseInt(currentValue, radix)
  }, 0)
  return (sum / arr.length).toFixed(fractionDigits)
}

let matchInStringArray = (item, stringArray, caseSensitive = true) => {
  for (let index in stringArray) {
    if (item.match(new RegExp(stringArray[index], caseSensitive ? '' : 'i'))) {
      return true
    }
  }
  return false
}

let fromOADate = function (msDate) {
  var d = new Date(((msDate - 25569) * 86400000) + (msDate >= 0.0 ? 0.5 : -0.5))
  var tz = d.getTimezoneOffset()
  var jO = new Date(((msDate - 25569 + (tz / (60 * 24))) * 86400000) + (msDate >= 0.0 ? 0.5 : -0.5))
  return moment(jO)
}

module.exports = {
  formatDate: formatDate,
  getAverageFromArray: getAverageFromArray,
  matchInStringArray: matchInStringArray,
  fromOADate: fromOADate
}
