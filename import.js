let csv = require('fast-csv')
let {formatDate, matchInStringArray, fromOADate} = require('./utils.js')
let {processDataEntry, computeData} = require('./data.js')
const logger = require('winston')
const XlsxExtractor = require('xlsx-extractor')

// todo. make these settings.
let tempNames = ['celsius', 'temp']
let humidityNames = ['hum']
let timeNames = ['time', 'date']
let dewPointNames = ['dew point']

let importExcel = function (filePath, maxTemp, minTemp, pivot, setProgress = () => {}) {
  return new Promise((resolve, reject) => {
    let dataEntries = []
    logger.info('Importing xlsx from ' + filePath)
    const extractor = new XlsxExtractor(filePath)
    const tasks = []
    for (let i = 1, max = extractor.count; i <= max; ++i) {
      tasks.push(extractor.extract(i))
    }

    Promise
    .all(tasks)
    .then((results) => {
      let validatedKeys = null
      try {
        validatedKeys = validateHeaders(results[0].cells[0])
      } catch (err) {
        reject(Error(err))
      }

      for (let i = 1; i < results[0].cells.length; i++) {
        setProgress(20 + (i / results[0].cells.length) * 60) // 20% for loading, 20% for graph drawing. 60% for this loop, 20% for graph

        let temperature = parseFloat(results[0].cells[i][validatedKeys.temp])
        if (isNaN(temperature)) {
          // This is likely the start of superfluous rows
          logger.info('Reached end of valid rows at index: ' + i)
          break
        }
        let timeDate = fromOADate(results[0].cells[i][validatedKeys.time])
        let humidity = parseFloat(results[0].cells[i][validatedKeys.humidity])
        let dewPoint = parseFloat(results[0].cells[i][validatedKeys.dewPoint])
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
  let headerKeys = headers
  let isObject = false

  if (!Array.isArray(headers)) {
    logger.debug('headers in validateHeaders is an object')
    isObject = true
    headerKeys = Object.getOwnPropertyNames(headers)
  }

  for (let i = 0; i < headerKeys.length; i++) {
    if (validatedKeys.temp === -1) {
      validatedKeys.temp = matchInStringArray(headerKeys[i], tempNames, false) ? (isObject ? headerKeys[i] : i) : -1
    }
    if (validatedKeys.humidity === -1) {
      validatedKeys.humidity = matchInStringArray(headerKeys[i], humidityNames, false) ? (isObject ? headerKeys[i] : i) : -1
    }
    if (validatedKeys.time === -1) {
      validatedKeys.time = matchInStringArray(headerKeys[i], timeNames, false) ? (isObject ? headerKeys[i] : i) : -1
    }
    if (validatedKeys.dewPoint === -1) {
      validatedKeys.dewPoint = matchInStringArray(headerKeys[i], dewPointNames, false) ? (isObject ? headerKeys[i] : i) : -1
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
      let time = formatDate(rawData[keys.time])
      let dewPoint = keys.dewPoint !== -1 ? parseFloat(rawData[keys.dewPoint]) : NaN

      dataEntries = processDataEntry(dataEntries, temperature, humidity, time, dewPoint, maxTemp, minTemp)
      logger.debug('data entries length: ' + dataEntries.length)
    })
    .on('end', () => {
      if (keys) {
        logger.debug('data entries final length: ' + dataEntries.length)
        try {
          let dataDict = computeData(dataEntries, pivot)
          if (keys.humidity === -1) {
            logger.debug('data entries after length: ' + dataDict.dataEntries.length)
          }
          logger.debug('End of import, sampleTime = ' + dataDict.sampleTime)
          logger.silly(dataDict)
          resolve(dataDict)
        } catch (e) {
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
