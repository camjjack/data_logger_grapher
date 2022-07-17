const matchInStringArray = (item, stringArray, caseSensitive = true) => {
  for (const index in stringArray) {
    if (item.match(new RegExp(stringArray[index], caseSensitive ? '' : 'i'))) {
      return true
    }
  }
  return false
}

const parseDate = function (dateStr) {
  if (dateStr.includes('/')) {
    const parts = dateStr.split(' ')
    const dateParts = parts[0].split('/')
    const timeParts = parts[1].split(':')
    const seconds = timeParts.length > 2 ? timeParts[2] : 0
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], seconds)
  } else {
    return new Date(dateStr)
  }
}
const fromOADate = function (msDate) {
  const d = new Date(((msDate - 25569) * 86400000) + (msDate >= 0.0 ? 0.5 : -0.5))
  const tz = d.getTimezoneOffset()
  const jO = new Date(((msDate - 25569 + (tz / (60 * 24))) * 86400000) + (msDate >= 0.0 ? 0.5 : -0.5))
  return jO
}

module.exports = {
  matchInStringArray,
  fromOADate,
  parseDate
}
