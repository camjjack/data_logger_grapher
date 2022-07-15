const csv = require('fast-csv')
const { formatDate, matchInStringArray, fromOADate } = require('./utils.js')
const { processDataEntry, computeData } = require('./data.js')
const logger = require('winston')
const xlsx = require('xlsx-extractor');

// todo. make these settings.
const tempNames = ['celsius', 'temp']
const humidityNames = ['hum']
const timeNames = ['time', 'date']
const dewPointNames = ['dew point']

const importExcel = function (filePath, maxTemp, minTemp, pivot, setProgress = () => { }) {
  return new Promise((resolve, reject) => {
    let dataEntries = []
    logger.info('Importing xlsx from ' + filePath)
    const count = xlsx.getSheetCount(filePath)
    const tasks = []
    for (let i = 1, max = count; i <= max; ++i) {
      tasks.push(xlsx.extract(filePath, i))
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

          const temperature = parseFloat(results[0].cells[i][validatedKeys.temp])
          if (isNaN(temperature)) {
            // This is likely the start of superfluous rows
            logger.info('Reached end of valid rows at index: ' + i)
            break
          }
          const timeDate = fromOADate(results[0].cells[i][validatedKeys.time])
          const humidity = parseFloat(results[0].cells[i][validatedKeys.humidity])
          const dewPoint = parseFloat(results[0].cells[i][validatedKeys.dewPoint])
          dataEntries = processDataEntry(dataEntries, temperature, humidity, timeDate, dewPoint, maxTemp, minTemp)
        }

        const dataDict = computeData(dataEntries, pivot)
        resolve(dataDict)
      })
      .catch((err) => {
        logger.error(err)
        reject(Error('Data import Error'))
      })
  })
}

function validateHeaders(headers) {
  const validatedKeys = {}
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

const importCSV = function (filePath, maxTemp, minTemp, pivot) {
  return new Promise((resolve, reject) => {
    let headingsValidated = false
    let dataEntries = []
    let keys = null

    logger.info('Importing CSV from ' + filePath)

    csv
      .parseFile(filePath, { headers: true, ignoreEmpty: true, discardUnmappedColumns: true })
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
        const temperature = parseFloat(rawData[keys.temp])
        const humidity = keys.humidity !== -1 ? parseFloat(rawData[keys.humidity]) : NaN
        const time = formatDate(rawData[keys.time])
        const dewPoint = keys.dewPoint !== -1 ? parseFloat(rawData[keys.dewPoint]) : NaN

        dataEntries = processDataEntry(dataEntries, temperature, humidity, time, dewPoint, maxTemp, minTemp)
        logger.debug('data entries length: ' + dataEntries.length)
      })
      .on('end', () => {
        if (keys) {
          logger.debug('data entries final length: ' + dataEntries.length)
          try {
            const dataDict = computeData(dataEntries, pivot)
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
  importExcel,
  importCSV
}
