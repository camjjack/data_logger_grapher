const moment = require('moment')
const logger = require('winston')

const formatDate = (dateString) => {
  let x = moment(dateString, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY H:mm', 'YYYY-MM-DD HH:mm:ss'])
  if (!x.isValid()) {
    logger.debug('doing non dd/mm: ', dateString)
    x = moment(dateString)
    logger.debug('converted to', x)
  }
  return x
}

const getAverageFromArray = (arr, radix = 10, fractionDigits = 2) => {
  const sum = arr.reduce((accumulator, currentValue) => {
    return accumulator + parseInt(currentValue, radix)
  }, 0)
  return (sum / arr.length).toFixed(fractionDigits)
}

const matchInStringArray = (item, stringArray, caseSensitive = true) => {
  for (const index in stringArray) {
    if (item.match(new RegExp(stringArray[index], caseSensitive ? '' : 'i'))) {
      return true
    }
  }
  return false
}

const fromOADate = function (msDate) {
  const d = new Date(((msDate - 25569) * 86400000) + (msDate >= 0.0 ? 0.5 : -0.5))
  const tz = d.getTimezoneOffset()
  const jO = new Date(((msDate - 25569 + (tz / (60 * 24))) * 86400000) + (msDate >= 0.0 ? 0.5 : -0.5))
  return moment(jO)
}

module.exports = {
  formatDate,
  getAverageFromArray,
  matchInStringArray,
  fromOADate
}
