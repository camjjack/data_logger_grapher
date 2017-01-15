let csv = require('fast-csv')
let {matchInStringArray} = require('./utils.js')
let {processDataEntry, computeData} = require('./data.js')
const logger = require('winston')
const XlsxExtractor = require('xlsx-extractor')

// todo. make these settings.
let tempNames = ['celsius', 'temp']
let humidityNames = ['hum']
let timeNames = ['time', 'date']
let dewPointNames = ['dew point']

let importExcel = function (filePath, maxTemp, minTemp, pivot) {
  let dataEntries = []

  return new Promise((resolve, reject) => {
    logger.info('Importing xlsx from ' + filePath)
    const extractor = new XlsxExtractor(filePath)
    const tasks = []
    for (let i = 1, max = extractor.count; i <= max; ++i) {
      tasks.push(extractor.extract(i))
    }
    let temperatureCell = -1
    let humidityCell = -1
    let timeCell = -1
    let dewPointCell = -1

    Promise
    .all(tasks)
    .then((results) => {
      for (let i = 0; i < results[0].cells[0].length; i++) {
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

      for (let i = 1; i < results[0].cells.length; i++) {
        let temperature = parseFloat(results[0].cells[i][temperatureCell])
        let v = results[0].cells[i][timeCell]
        let date = (v | 0)
        let time = Math.floor(86400 * (v - date))
        let dow = 0
        let dout = []
        let out = { D: date, T: time, u: 86400 * (v - date) - time, y: 0, m: 0, d: 0, H: 0, M: 0, S: 0, q: 0 }
        if (out.u > 0.999) {
          out.u = 0
          if (++time === 86400) { time = 0; ++date }
        }
        if (date > 60) --date
        /* 1 = Jan 1 1900 */
        let d = new Date(1900, 0, 1)
        d.setDate(d.getDate() + date - 1)
        dout = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
        dow = d.getDay()
        if (date < 60) dow = (dow + 6) % 7
        out.y = dout[0]; out.m = dout[1] - 1; out.d = dout[2]
        out.S = time % 60; time = Math.floor(time / 60)
        out.M = time % 60; time = Math.floor(time / 60)
        out.H = time
        out.q = dow
        let timeDate = new Date(out.y, out.m, out.d, out.H, out.M, out.S)
        let humidity = parseFloat(results[0].cells[i][humidityCell])
        let dewPoint = parseFloat(results[0].cells[i][dewPointCell])
        dataEntries = processDataEntry(dataEntries, temperature, humidity, timeDate, dewPoint, maxTemp, minTemp)
      }

      let dataDict = computeData(dataEntries, pivot)
      resolve(dataDict)
    })
    .catch((err) => {
      logger.error(err)
      reject(Error('Data import Error'))
    })
  })
}

function validateHeaders (headers) {
  let validatedKeys = {}
  validatedKeys.temp = -1
  validatedKeys.humidity = -1
  validatedKeys.time = -1
  validatedKeys.dewPoint = -1

  let headerKeys = Object.getOwnPropertyNames(headers)
  for (let i = 0; i < headerKeys.length; i++) {
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

let importCSV = function (filePath, maxTemp, minTemp, pivot) {
  return new Promise((resolve, reject) => {
    let headingsValidated = false
    let headingsValid = false
    let dataEntries = []
    let keys = null

    logger.info('Importing CSV from ' + filePath)

    csv
    .fromPath(filePath, {headers: true, ignoreEmpty: true, discardUnmappedColumns: true})
    .validate((rawData) => {
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
    .on('data', (rawData) => {
      let temperature = parseFloat(rawData[keys.temp])
      let humidity = keys.humidity !== -1 ? parseFloat(rawData[keys.humidity]) : NaN
      let time = rawData[keys.time]
      let dewPoint = keys.dewPoint !== -1 ? parseFloat(rawData[keys.dewPoint]) : NaN

      dataEntries = processDataEntry(dataEntries, temperature, humidity, time, dewPoint, maxTemp, minTemp)
      logger.debug('data entries length: ' + dataEntries.length)
    })
    .on('end', () => {
      if (keys) {
        logger.debug('data entries final length: ' + dataEntries.length)
        let dataDict = computeData(dataEntries, pivot)

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
    }).on('data-invalid', () => {
      // ignore
    }).on('error', (error) => {
      logger.error('Error importing CSV:' + error)
      reject(new Error('Error importing CSV'))
    })
  })
}

module.exports = {
  importExcel: importExcel,
  importCSV: importCSV
}
