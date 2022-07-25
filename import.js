const csv = require('fast-csv')
const { matchInStringArray, fromOADate, parseDate } = require('./utils.js')
const logger = require('./log.js')
const xlsx = require('xlsx-extractor')
const { getConfig } = require('./configuration.js')
const { getWebContents } = require('./mainWindow.js')

// todo. make these settings.
const tempNames = ['celsius', 'temp']
const humidityNames = ['hum']
const timeNames = ['time', 'date']
const dewPointNames = ['dew point']

const files = []

const processDataEntry = function (dataEntries, temperature, humidity, date, dewPoint, maxTemp, minTemp) {
  const data = { temperature, humidity, dewPoint, date }

  if (data.temperature < maxTemp && data.temperature > minTemp) {
    data.timeStep = dataEntries.length ? data.date - dataEntries[dataEntries.length - 1].date : 0
    dataEntries.push(data)
  }
  return dataEntries
}

const importExcel = (filePath, maxTemp, minTemp, setProgress = () => { }) => {
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
          //  setProgress(20 + (i / results[0].cells.length) * 60) // 20% for loading, 20% for graph drawing. 60% for this loop, 20% for graph

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
        resolve(JSON.stringify(dataEntries))
      })
      .catch((err) => {
        logger.error(err)
        reject(Error('Data import Error'))
      })
  })
}

const validateHeaders = (headers) => {
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

const importCSV = (filePath, maxTemp, minTemp) => {
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
          } catch (err) {
            reject(Error(err))
          }
        }
        return keys != null
      })
      .on('data', (rawData) => {
        const temperature = parseFloat(rawData[keys.temp])
        const humidity = keys.humidity !== -1 ? parseFloat(rawData[keys.humidity]) : NaN
        const time = parseDate(rawData[keys.time])
        const dewPoint = keys.dewPoint !== -1 ? parseFloat(rawData[keys.dewPoint]) : NaN

        dataEntries = processDataEntry(dataEntries, temperature, humidity, time, dewPoint, maxTemp, minTemp)
      })
      .on('end', () => {
        if (keys) {
          logger.debug('data entries final length: ' + dataEntries.length)
          try {
            resolve(JSON.stringify(dataEntries))
            logger.debug('resolve')
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

const processFile = (index, filePath) => {
  logger.info('processFile: ' + filePath)
  files[index] = filePath
  const config = getConfig()
  const webContents = getWebContents()
  const filename = filePath.split('/').pop()
  if (filePath.endsWith('.xlsx')) {
    setTimeout(function () {
      importExcel(filePath, config.maxTemp, config.minTemp, config.pivot, (progress) => { /* graphDiv.getElementsByClassName('determinate')[0].style.width = `${progress}%` */ }).then((xlsxDict) => {
        logger.debug('done importExcel')
        webContents.send('update-graph', index, filename, xlsxDict)
      }, (error) => {
        logger.log('error', 'Failed to import xlsx ' + error)
      })
    }, 500)
  } else {
    setTimeout(function () {
      importCSV(filePath, config.maxTemp, config.minTemp, config.pivot).then(csvDataDict => {
        logger.debug('done importCSV')
        webContents.send('update-graph', index, filename, csvDataDict)
      }, (error) => {
        logger.log('error', 'Failed to import csv', error)
      }).catch((err) => {
        logger.error(err)
      })
    }, 500)
  }
}

const reprocess = () => {
  for (let i = 0; i < files.length; ++i) {
    if (files[i]) { processFile(i, files[i]) }
  }
}

module.exports = {
  processFile,
  importCSV,
  importExcel,
  reprocess
}
