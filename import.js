var csv = require('fast-csv')
var {matchInStringArray} = require('./utils.js')
var {processDataEntry, computeData} = require('./data.js')
const logger = require('winston')
const XlsxExtractor = require('xlsx-extractor')

// todo. make these settings.
var tempNames = ['celsius', 'temp']
var humidityNames = ['hum']
var timeNames = ['time', 'date']
var dewPointNames = ['dew point']

var importExcel = function (filePath, maxTemp, minTemp, pivot) {
  var dataEntries = []

  return new Promise(function (resolve, reject) {
    logger.info('Importing xlsx from ' + filePath)
    const extractor = new XlsxExtractor(filePath)
    const tasks = []
    for (let i = 1, max = extractor.count; i <= max; ++i) {
      tasks.push(extractor.extract(i))
    }
    var temperatureCell = -1
    var humidityCell = -1
    var timeCell = -1
    var dewPointCell = -1

    Promise
    .all(tasks)
    .then((results) => {
      for (var i = 0; i < results[0].cells[0].length; i++) {
        if (matchInStringArray(results[0].cells[0][i], tempNames)) {
          temperatureCell = i
          logger.debug('temperatureCell = ' + i)
        } else if (matchInStringArray(results[0].cells[0][i], humidityNames)) {
          humidityCell = i
          logger.debug('humidityCell = ' + i)
        } else if (matchInStringArray(results[0].cells[0][i], timeNames)) {
          timeCell = i
          logger.debug('timeCell = ' + i)
        } else if (matchInStringArray(results[0].cells[0][i], dewPointNames)) {
          dewPointCell = i
          logger.debug('dewPointCell = ' + i)
        }
      }
      // required columns
      if (temperatureCell === -1) {
        logger.error('Couldn\'t find temperature column in file')
        reject(Error('Data import Error. Couldn\'t find temperature column in file'))
      }
      if (timeCell === -1) {
        logger.error('Couldn\'t find time/date column in file')
        reject(Error('Data import Error. Couldn\'t find time/date column in file'))
      }

      for (i = 1; i < results[0].cells.length; i++) {
        var temperature = parseFloat(results[0].cells[i][temperatureCell])
        var v = results[0].cells[i][timeCell]
        var date = (v | 0)
        var time = Math.floor(86400 * (v - date))
        var dow = 0
        var dout = []
        var out = { D: date, T: time, u: 86400 * (v - date) - time, y: 0, m: 0, d: 0, H: 0, M: 0, S: 0, q: 0 }
        if (out.u > 0.999) {
          out.u = 0
          if (++time === 86400) { time = 0; ++date }
        }
        if (date > 60) --date
        /* 1 = Jan 1 1900 */
        var d = new Date(1900, 0, 1)
        d.setDate(d.getDate() + date - 1)
        dout = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
        dow = d.getDay()
        if (date < 60) dow = (dow + 6) % 7
        out.y = dout[0]; out.m = dout[1] - 1; out.d = dout[2]
        out.S = time % 60; time = Math.floor(time / 60)
        out.M = time % 60; time = Math.floor(time / 60)
        out.H = time
        out.q = dow
        var timeDate = new Date(out.y, out.m, out.d, out.H, out.M, out.S)
        var humidity = parseFloat(results[0].cells[i][humidityCell])
        var dewPoint = parseFloat(results[0].cells[i][dewPointCell])
        dataEntries = processDataEntry(dataEntries, temperature, humidity, timeDate, dewPoint, maxTemp, minTemp)
      }

      var dataDict = computeData(dataEntries, pivot)
      resolve(dataDict)
    })
    .catch((err) => {
      logger.error(err)
      reject(Error('Data import Error'))
    })
  })
}

function validateHeaders (headers) {
  var validatedKeys = {}
  validatedKeys.temp = -1
  validatedKeys.humidity = -1
  validatedKeys.time = -1
  validatedKeys.dewPoint = -1

  var headerKeys = Object.getOwnPropertyNames(headers)
  for (var i = 0; i < headerKeys.length; i++) {
    if (validatedKeys.temp === -1) {
      validatedKeys.temp = matchInStringArray(headerKeys[i], tempNames) ? headerKeys[i] : -1
    }
    if (validatedKeys.humidity === -1) {
      validatedKeys.humidity = matchInStringArray(headerKeys[i], humidityNames) ? headerKeys[i] : -1
    }
    if (validatedKeys.time === -1) {
      validatedKeys.time = matchInStringArray(headerKeys[i], timeNames) ? headerKeys[i] : -1
    }
    if (validatedKeys.dewPoint === -1) {
      validatedKeys.dewPoint = matchInStringArray(headerKeys[i], dewPointNames) ? headerKeys[i] : -1
    }
  }

  logger.info('validating  keys', validatedKeys)
  // required columns
  if (validatedKeys.temp === -1) {
    throw Error('Couldn\'t find temperature column in file')
  }
  if (validatedKeys.time === -1) {
    throw Error('Couldn\'t find time/date column in file')
  }
  logger.info('correctly validated keys')
  return validatedKeys
}

var importCSV = function (filePath, maxTemp, minTemp, pivot) {
  return new Promise(function (resolve, reject) {
    var headingsValidated = false
    var headingsValid = false
    var dataEntries = []
    var keys = null

    logger.info('Importing CSV from ' + filePath)

    csv
    .fromPath(filePath, {headers: true, ignoreEmpty: true, discardUnmappedColumns: true})
    .validate(function (rawData) {
      if (headingsValidated === false) {
        try {
          headingsValidated = true
          keys = validateHeaders(rawData)
          headingsValid = true
        } catch (err) {
          reject(Error(err))
        }
      }
      return keys != null
    })
    .on('data', function (rawData) {
      var temperature = parseFloat(rawData[keys.temp])
      var humidity = keys.humidity !== -1 ? parseFloat(rawData[keys.humidity]) : NaN
      var time = rawData[keys.time]
      var dewPoint = keys.dewPoint !== -1 ? parseFloat(rawData[keys.dewPoint]) : NaN

      dataEntries = processDataEntry(dataEntries, temperature, humidity, time, dewPoint, maxTemp, minTemp)
      logger.debug('data entries length: ' + dataEntries.length)
    })
    .on('end', function () {
      if (keys) {
        logger.debug('data entries final length: ' + dataEntries.length)
        var dataDict = computeData(dataEntries, pivot)

        if (keys.humidity === -1) {
          logger.debug('data entries after length: ' + dataDict.dataEntries.length)
        }
        logger.debug('End of import, sampleTime = ' + dataDict.sampleTime)
        if (dataDict.sampleTime > 0) {
          logger.silly(dataDict)
          resolve(dataDict)
        } else if (headingsValid) {
          logger.error('Data import Error, sampleTime == 0')
          reject(Error('Data import Error'))
        }
      }
      // else: already rejected
    }).on('data-invalid', function () {
      // ignore
    }).on('error', function (error) {
      logger.error('Error importing CSV:' + error)
      reject(new Error('Error importing CSV'))
    })
  })
}

module.exports = {
  importExcel: importExcel,
  importCSV: importCSV
}
