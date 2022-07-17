const getAverageFromArray = (arr, radix = 10, fractionDigits = 2) => {
  const sum = arr.reduce((accumulator, currentValue) => {
    return accumulator + parseInt(currentValue, radix)
  }, 0)
  return (sum / arr.length).toFixed(fractionDigits)
}

const initialiseDataDict = function () {
  const dataDict = {}

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

const sliceDataDictArrays = function (dataDict, startIndex, endIndex) {
  dataDict.dataEntries = dataDict.dataEntries.slice(startIndex, endIndex)
  return dataDict
}

const computeData = (dataEntries, pivot, startTime = 0, endTime = 0) => {
  console.log('ComputeData with pivot: ' + pivot + ', startTime: ' + startTime + ', and endTime: ' + endTime)
  const dataDict = initialiseDataDict()
  dataDict.dataEntries = dataEntries
  let startIndex = 0
  let endIndex = dataDict.dataEntries.length

  if (endIndex === 0) {
    console.log('Wooh there, how did this happen?')
    throw Error('Invalid dataDict passed to computeData')
  }
  // converts dates into moment
  for (let index = 0; index < dataDict.dataEntries.length; index++) {
    dataDict.dataEntries[index].date = new Date(dataDict.dataEntries[index].date)

    if (startTime && (startIndex === 0) && (startTime <= dataDict.dataEntries[index].date)) {
      console.log('Starting at index ' + index + ', time: ' + dataDict.dataEntries[index].date)
      startIndex = index
    }
    if (endTime && (endIndex === dataDict.dataEntries.length) && (endTime < dataDict.dataEntries[index].date)) {
      console.log('Ending at index ' + index + ', last valid time: ' + dataDict.dataEntries[index - 1].date)
      endIndex = index
    }
  }
  const reducedDataDict = sliceDataDictArrays(dataDict, startIndex, endIndex)

  // recalulate above/below if pivot changed.
  console.log('length ' + reducedDataDict.dataEntries.length)
  console.log('Ending at ' + reducedDataDict.dataEntries[reducedDataDict.dataEntries.length - 1].date)
  console.log('starting at ' + reducedDataDict.dataEntries[0].date)
  console.log('timeStep ' + reducedDataDict.dataEntries[0].timeStep)
  reducedDataDict.sampleTime = reducedDataDict.dataEntries[reducedDataDict.dataEntries.length - 1].date - reducedDataDict.dataEntries[0].date
  reducedDataDict.timeCooling = 0
  reducedDataDict.timeAbove = 0
  reducedDataDict.timeBelow = 0
  reducedDataDict.humidity = []
  reducedDataDict.dewPoint = []
  reducedDataDict.time = []
  reducedDataDict.temperature = []

  for (let index = 0; index < reducedDataDict.dataEntries.length; index++) {
    reducedDataDict.time.push(reducedDataDict.dataEntries[index].date)
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
  console.log('time cooling ' + reducedDataDict.timeCooling)
  console.log('timeAbove ' + reducedDataDict.timeAbove)
  console.log('timeBelow ' + reducedDataDict.timeBelow)
  console.log('humidityAverage ' + reducedDataDict.humidityAverage)
  console.log('dewPointAverage ' + reducedDataDict.dewPointAverage)
  console.log('sampleTime ' + reducedDataDict.sampleTime)
  reducedDataDict.cooling_percentage = ((reducedDataDict.timeCooling / reducedDataDict.sampleTime) * 100).toFixed(2)
  reducedDataDict.abovePivotPercentage = ((reducedDataDict.timeAbove / reducedDataDict.sampleTime) * 100).toFixed(2)
  reducedDataDict.belowPivotPercentage = ((reducedDataDict.timeBelow / reducedDataDict.sampleTime) * 100).toFixed(2)

  return reducedDataDict
}

if (typeof module !== 'undefined') {
  module.exports = {
    getAverageFromArray,
    computeData
  }
}
