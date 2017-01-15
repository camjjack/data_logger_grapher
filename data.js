let {formatDate, getAverageFromArray} = require('./utils.js')
const logger = require('winston')

let initialiseDataDict = function () {
  let dataDict = {}

  dataDict.time = []
  dataDict.temperature = []
  dataDict.humidity = []
  dataDict.dewPoint = []
  dataDict.dataEntries = []
  dataDict.timeCooling = 0
  dataDict.timeAbove = 0
  dataDict.timeBelow = 0
  dataDict.sampleTime = 0
  return dataDict
}

let sliceDataDictArrays = function (dataDict, startIndex, endIndex) {
  dataDict.dataEntries = dataDict.dataEntries.slice(startIndex, endIndex)
  return dataDict
}

let processDataEntry = function (dataEntries, temperature, humidity, time, dewPoint, maxTemp, minTemp) {
  let data = {}
  data.temperature = temperature
  data.humidity = humidity
  data.dewPoint = dewPoint

  if (data.temperature < maxTemp && data.temperature > minTemp) {
    data.date = formatDate(time)
    data.timeStep = dataEntries.length ? data.date.diff(dataEntries[dataEntries.length - 1].date) : 0
    dataEntries.push(data)
  } else {
  }
  return dataEntries
}

let computeData = function (dataEntries, pivot, startTime = 0, endTime = 0) {
  logger.info('ComputeData with pivot', pivot)
  console.log('ComputeData with pivot', pivot)
  let dataDict = initialiseDataDict()
  dataDict.dataEntries = dataEntries
  let startIndex = 0
  let endIndex = dataDict.dataEntries.length

  if (endIndex === 0) {
    logger.error('Wooh there, how did this happen?')
    throw Error('Invalid dataDict passed to computeData')
  }
  if (startTime) {
    // find the first entry to process
    logger.info('Trimming data range to start at: ' + startTime)
    for (let index = 0; index < dataDict.dataEntries.length; index++) {
      if (startTime.isBefore(dataDict.dataEntries[index].date)) {
        logger.info('Starting at index ' + index + ', time: ' + dataDict.dataEntries[index].date)
        startIndex = index
        break
      }
    }
  }
  if (endTime) {
    // find the first entry to process
    logger.info('Trimming data range to end at: ' + endTime)
    for (let index = 0; index < dataDict.dataEntries.length; index++) {
      if (endTime.isBefore(dataDict.dataEntries[index].date)) {
        logger.info('Ending at index ' + index + ', time: ' + dataDict.dataEntries[index].date)
        endIndex = index
        break
      }
    }
  }
  let reducedDataDict = sliceDataDictArrays(dataDict, startIndex, endIndex)

  // recalulate above/below if pivot changed.
  logger.debug('length ' + reducedDataDict.dataEntries.length)
  logger.debug('Ending at ' + reducedDataDict.dataEntries[reducedDataDict.dataEntries.length - 1].date)
  logger.debug('starting at ' + reducedDataDict.dataEntries[0].date)
  reducedDataDict.sampleTime = reducedDataDict.dataEntries[reducedDataDict.dataEntries.length - 1].date.diff(reducedDataDict.dataEntries[0].date)
  reducedDataDict.timeCooling = 0
  reducedDataDict.timeAbove = 0
  reducedDataDict.timeBelow = 0
  reducedDataDict.humidity = []
  reducedDataDict.dewPoint = []
  reducedDataDict.time = []
  reducedDataDict.temperature = []

  for (let index = 0; index < reducedDataDict.dataEntries.length; index++) {
    reducedDataDict.time.push(reducedDataDict.dataEntries[index].date.format())
    reducedDataDict.temperature.push(reducedDataDict.dataEntries[index].temperature)
    reducedDataDict.humidity.push(reducedDataDict.dataEntries[index].humidity)
    reducedDataDict.dewPoint.push(reducedDataDict.dataEntries[index].dewPoint)
    if (index > 0) {
      if (reducedDataDict.dataEntries[index].temperature < reducedDataDict.dataEntries[index - 1].temperature) {
        reducedDataDict.timeCooling += reducedDataDict.dataEntries[index].timeStep
      }
      if (reducedDataDict.dataEntries[index].temperature > pivot) {
        reducedDataDict.timeAbove += reducedDataDict.dataEntries[index].timeStep
      } else if (reducedDataDict.dataEntries[index].temperature < pivot) {
        reducedDataDict.timeBelow += reducedDataDict.dataEntries[index].timeStep
      }
    }
  }

  reducedDataDict.humidityAverage = getAverageFromArray(reducedDataDict.humidity)
  reducedDataDict.dewPointAverage = getAverageFromArray(reducedDataDict.dewPoint)
  logger.debug('time cooling ' + reducedDataDict.timeCooling)
  logger.debug('timeAbove ' + reducedDataDict.timeAbove)
  logger.debug('timeBelow ' + reducedDataDict.timeBelow)
  logger.debug('humidityAverage ' + reducedDataDict.humidityAverage)
  logger.debug('dewPointAverage ' + reducedDataDict.dewPointAverage)
  logger.debug('sampleTime ' + reducedDataDict.sampleTime)
  logger.debug('sampleTime ' + reducedDataDict.sampleTime)
  reducedDataDict.cooling_percentage = ((reducedDataDict.timeCooling / reducedDataDict.sampleTime) * 100).toFixed(2)
  reducedDataDict.abovePivotPercentage = ((reducedDataDict.timeAbove / reducedDataDict.sampleTime) * 100).toFixed(2)
  reducedDataDict.belowPivotPercentage = ((reducedDataDict.timeBelow / reducedDataDict.sampleTime) * 100).toFixed(2)

  return reducedDataDict
}

module.exports = {
  processDataEntry: processDataEntry,
  initialiseDataDict: initialiseDataDict,
  computeData: computeData
}
