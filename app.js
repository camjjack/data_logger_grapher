/* global Materialize, Plotly */
const electron = require('electron')
let {importExcel, importCSV} = require('./import.js')
let {computeData} = require('./data.js')
const logger = require('./log.js')

const remote = electron.remote
const Menu = remote.Menu
const menu = require('./menu.js')
let {config} = require('./configuration.js')
let moment = require('moment')
const ipcRenderer = electron.ipcRenderer

Menu.setApplicationMenu(Menu.buildFromTemplate(menu.menuTemplate))

let graphData = {}
let firstFile = {}
let secondFile = {}

let getTable = function (dataDict, name) {
  let s = '<table class="striped"><thead><tr><th data-field="item" colspan="2" class="center-align">' + name + '</th></tr></thead><tbody>'
  s += '<tr><th>Sample time</th><td>' + dataDict.sampleTime / 60000 + ' minutes</td></tr>'
  s += '<tr><th>% time spent cooling</th><td>' + dataDict.cooling_percentage + '%</td></tr>'
  s += '<tr><th>% time above ' + config.pivot + '&deg;C</th><td>' + dataDict.abovePivotPercentage + '%</td></tr>'
  s += '<tr><th>% time below ' + config.pivot + '&deg;C</th><td>' + dataDict.belowPivotPercentage + '%</td></tr>'
  if (!isNaN(dataDict.humidityAverage)) {
    s += '<tr><th>Humidity average</th><td>' + dataDict.humidityAverage + '</td></tr>'
  }
  if (!isNaN(dataDict.dewPointAverage)) {
    s += '<tr><th>Dew point average</th><td>' + dataDict.dewPointAverage + '&deg;C</td></tr>'
  }
  s += '</tbody></table>'
  return s
}

let processFile = function (file, graphDivName, tableDiv) {
  logger.log('info', 'ProcessFile: ' + file.path)

  if (file.name.endsWith('.xlsx')) {
    importExcel(file.path, config.maxTemp, config.minTemp, config.pivot).then((xlsxDict) => {
      graphData[file.name] = xlsxDict
      doGraph(file.name, graphDivName, tableDiv)
    }, (error) => {
      Materialize.toast(error, 10000)
      logger.log('error', 'Failed to import csv ' + error)
    })
  } else {
    importCSV(file.path, config.maxTemp, config.minTemp, config.pivot).then((csvDataDict) => {
      graphData[file.name] = csvDataDict
      doGraph(file.name, graphDivName, tableDiv)
    }, (error) => {
      Materialize.toast(error, 10000)
      logger.log('error', 'Failed to import csv', error)
    })
  }
}

let doGraph = function (name, graphDivName, tableDiv) {
  let data = []
  let layout = {
    title: name.split('.')[0],
    xaxis: {
      showgrid: false,                  // remove the x-axis grid lines
      rangeselector: {}
    }
  }

  if (config.displayTemp) {
    logger.info('graphing with temp')
    data.push({
      x: graphData[name].time,
      y: graphData[name].temperature,
      name: 'temperature'
    })
    layout.yaxis = {title: 'Temperature'}
  }
  if (config.displayHumidity) {
    logger.info('graphing with humidity')
    data.push({
      x: graphData[name].time,
      y: graphData[name].humidity,
      name: 'humidity'
    })
    if (layout.yaxis === undefined) {
      layout.yaxis = {title: 'Humidity'}
    } else {
      data[1].yaxis = 'y2'
      layout.yaxis2 = { title: 'Humidity',
        overlaying: 'y',
        side: 'right'
      }
    }
  }
  logger.info('data ' + data[0])

  let myDiv = document.getElementById(graphDivName)
  Plotly.newPlot(myDiv, data, layout)

  myDiv.on('plotly_relayout',
    (eventdata) => {
      let startTime = eventdata['xaxis.range[0]'] !== undefined ? moment(eventdata['xaxis.range[0]']) : 0
      let endTime = eventdata['xaxis.range[1]'] !== undefined ? moment(eventdata['xaxis.range[1]']) : 0
      logger.debug('Graph relayout:')
      logger.debug('start_time ' + startTime)

      tableDiv.innerHTML = getTable(computeData(graphData[name].dataEntries, config.pivot, startTime, endTime), name)

      // tell the main process we have finished.
      ipcRenderer.send('resising-finished')
    }
  )

  window.addEventListener('resize', () => { Plotly.Plots.resize(myDiv) })
  tableDiv.innerHTML = getTable(graphData[name], name)
}

document.ondragover = (event) => {
  event.preventDefault()
  return false
}

document.ondrop = (event) => {
  event.preventDefault()
  return false
}

document.addEventListener('DOMContentLoaded', () => {
  let first = document.getElementById('first')
  let second = document.getElementById('second')
  first.ondragover = () => {
    return false
  }
  first.ondragleave = first.ondragend = () => {
    return false
  }

  first.ondrop = (e) => {
    e.preventDefault()
    let file = e.dataTransfer.files[0]
    firstFile = {path: file.path, name: file.name}
    processFile(firstFile, 'graph1', first)
    return false
  }
  second.ondragover = () => {
    return false
  }
  second.ondragleave = second.ondragend = () => {
    return false
  }
  second.ondrop = (e) => {
    e.preventDefault()
    let file = e.dataTransfer.files[0]
    secondFile = {path: file.path, name: file.name}
    processFile(secondFile, 'graph2', second)
    return false
  }

  ipcRenderer.on('reprocess', (event, c) => {
    config = c
    logger.info('received reprocess request from main')
    if (firstFile.path) {
      processFile(firstFile, 'graph1', first)
    }
    if (secondFile.path) {
      processFile(secondFile, 'graph2', second)
    }
  })
})
