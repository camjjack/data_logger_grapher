/* global computeData, Plotly, M */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('table1').ondrop = (event) => {
    event.preventDefault()
    event.stopPropagation()

    for (const f of event.dataTransfer.files) {
      // Using the path attribute to get absolute file path
      console.log('File Path of dragged files for first: ', f.path)
    }
  }
  document.getElementById('table2').ondrop = (event) => {
    event.preventDefault()
    event.stopPropagation()

    for (const f of event.dataTransfer.files) {
      // Using the path attribute to get absolute file path
      console.log('File Path of dragged files for second: ', f.path)
    }
  }
})

const getTable = function (dataDict, name, pivot) {
  let s = `<table class="striped"><thead><tr><th data-field="item" colspan="2" class="center-align">${name}</th></tr></thead><tbody>
      <tr><th>Sample time</th><td>${dataDict.sampleTime / 60000} minutes</td></tr>
      <tr><th>% time spent cooling</th><td>${dataDict.cooling_percentage}%</td></tr>
      <tr><th>% time above ${pivot}&deg;C</th><td>${dataDict.abovePivotPercentage}%</td></tr>
      <tr><th>% time below ${pivot}&deg;C</th><td>${dataDict.belowPivotPercentage}%</td></tr>`

  if (!isNaN(dataDict.humidityAverage)) {
    s += `<tr><th>Humidity average</th><td>${dataDict.humidityAverage}</td></tr>`
  }
  if (!isNaN(dataDict.dewPointAverage)) {
    s += `<tr><th>Dew point average</th><td>${dataDict.dewPointAverage}&deg;C</td></tr>`
  }
  s += '</tbody></table>'
  return s
}

window.electronAPI.handleDoGraph(async (event, index, filename, dataStr) => {
  console.log('in handleDoGraph. index = ' + index + ', filename = ' + filename)
  const graphDiv = document.getElementById('graph' + index)
  const tableDiv = document.getElementById('table' + index)
  const config = await window.electronAPI.getConfig()
  console.log('config.detectCoolingViaHumidityInc = ' + config.detectCoolingViaHumidityInc)
  const importData = computeData(JSON.parse(dataStr), config.pivot, config.detectCoolingViaHumidityInc)
  // let data = JSON.parse(value["data"]);
  console.log(importData)
  const data = []
  const layout = {
    title: filename,
    xaxis: {
      showgrid: false, // remove the x-axis grid lines
      rangeselector: {}
    }
  }

  if (config.displayTemp) {
    console.log('graphing with temp')
    data.push({
      x: importData.time,
      y: importData.temperature,
      name: 'temperature'
    })
    layout.yaxis = { title: 'Temperature' }
  }
  if (config.displayHumidity) {
    console.log('graphing with humidity')
    data.push({
      x: importData.time,
      y: importData.humidity,
      name: 'humidity'
    })
    if (layout.yaxis === undefined) {
      layout.yaxis = { title: 'Humidity' }
    } else {
      data[1].yaxis = 'y2'
      layout.yaxis2 = {
        title: 'Humidity',
        overlaying: 'y',
        side: 'right'
      }
    }
  }
  console.log('data ' + data[0])
  Plotly.newPlot(graphDiv, data, layout)

  graphDiv.on('plotly_relayout',
    (eventdata) => {
      const startTime = eventdata['xaxis.range[0]'] !== undefined ? new Date(eventdata['xaxis.range[0]']) : 0
      const endTime = eventdata['xaxis.range[1]'] !== undefined ? new Date(eventdata['xaxis.range[1]']) : 0
      console.log('Graph relayout:')
      console.log('start_time ' + startTime)
      try {
        tableDiv.innerHTML = getTable(computeData(JSON.parse(dataStr), config.pivot, config.detectCoolingViaHumidityInc, startTime, endTime), filename, config.pivot)
      } catch (error) {
        M.toast(`Error: ${error}`)
      }

      // tell the main process we have finished.
      window.electronAPI.resisingFinished()
    }
  )

  window.addEventListener('resize', () => { Plotly.Plots.resize(graphDiv) })
  tableDiv.innerHTML = getTable(importData, filename, config.pivot)
})
