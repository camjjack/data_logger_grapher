const electron = require('electron');
var {importExcel, importCSV} = require( './import.js' );
var {computeData} = require( './utils.js' );
const logger = require('./log.js');

const remote = electron.remote;
const Menu = remote.Menu;
const menu = require('./menu.js');
var {config} = require('./configuration.js');
var moment = require('moment');
const ipcRenderer = electron.ipcRenderer;

Menu.setApplicationMenu(Menu.buildFromTemplate(menu.menuTemplate));


var graph_data = {};
var first_file = {};
var second_file = {};

var getTable = function(data_dict, start, end) {
    var s = "<table class='striped'><thead><tr><th data-field='item' colspan='2' class='center-align'>" + name + "</th></tr></thead><tbody>";
    s += "<tr><th>Sample time</th><td>" + data_dict.sampleTime / 60000 + " minutes</td></tr>";
    s += "<tr><th>% time spent cooling</th><td>" + data_dict.cooling_percentage + "%</td></tr>";
    s += "<tr><th>% time above " + config.pivot + "&deg;C</th><td>" + data_dict.above_pivot_percentage + "%</td></tr>";
    s += "<tr><th>% time below " + config.pivot + "&deg;C</th><td>" + data_dict.below_pivot_percentage + "%</td></tr>";
    if(!isNaN(data_dict.humidity_average)) {
        s += "<tr><th>Humidity average</th><td>" + data_dict.humidity_average + "</td></tr>";
    }
    if(!isNaN(data_dict.dew_point_average)) {
        s += "<tr><th>Dew point average</th><td>" + data_dict.dew_point_average + "&deg;C</td></tr>";
    }
    s += "</tbody></table>";
    return s;
}
var processFile = function(file, graphDivName, tableDiv) {
    logger.log('info', 'ProcessFile: ' + file.path);

    if(file.name.endsWith('.xlsx')) {
       importExcel(file.path, config.max_temp, config.min_temp, config.pivot).then(function(xlstime_dict) {
            graph_data[file.name] = xlstime_dict;
            doGraph(file.name, graphDivName, tableDiv);
       }, function(error) {
           
           Materialize.toast(error, 10000);
           logger.log('error', "Failed to import csv" + error);
       })
    }
    else {
       importCSV(file.path, config.max_temp, config.min_temp, config.pivot).then(function(csv_data_dict) {
            graph_data[file.name] = csv_data_dict;
            doGraph(file.name, graphDivName, tableDiv);
       }, function(error) {
           Materialize.toast(error, 10000);
           logger.log('error', "Failed to import csv", error);
       })
    }
}

var doGraph = function(name, graphDivName, tableDiv) {
    var data = [];

    var layout = {
      title: name.split(".")[0],
      xaxis: {
        showgrid: false,                  // remove the x-axis grid lines
        rangeselector: {},
      }
    };

    if(config.display_temp) {
        logger.info("graphing with temp");
        data.push({
            x: graph_data[name].time,
            y: graph_data[name].temperature,
            name: 'temperature',
        });
        layout.yaxis = { title: "Temperature"};
    }
    if(config.display_humidity) {
        logger.info("graphing with humidity");
        data.push({
            x: graph_data[name].time,
            y: graph_data[name].humidity,
            name: 'humidity'
        });
        if(layout.yaxis === undefined) {
            layout.yaxis = { title: "Humidity"};
        }
        else {
            data[1].yaxis = 'y2';
            layout.yaxis2 = { title: "Humidity",
                overlaying: 'y',
                side: 'right'
            };
        }
    }
    logger.info("data " + data[0]);
    /*
    var d3 = Plotly.d3,
    var gd3 = d3.select("div[id='" + graphDivName + "']");
    var gd = gd3.node();
    Plotly.newPlot(gd, data, layout);
    */

        var myDiv = document.getElementById('graph1');

    var d3 = Plotly.d3;
        

    Plotly.plot(myDiv, data, layout);

    myDiv.on('plotly_relayout',
        function(eventdata){  
            var startTime = 0;
            var endTime = 0;
            logger.debug("start_time " + eventdata['xaxis.range[0]']);
            logger.debug("end_time " + eventdata['xaxis.range[1]']);
            // set the date range to be recalculated for the table data.
            if( eventdata['xaxis.range[0]'] != undefined ) {
               startTime = moment(eventdata['xaxis.range[0]']);
            }
            
            if( eventdata['xaxis.range[1]'] != undefined ) {
                endTime = moment(eventdata['xaxis.range[1]']);
            }
            var resized_graph_data = computeData(graph_data[name].data_entries, startTime, endTime);

            tableDiv.innerHTML = getTable(resized_graph_data);
            
        });


    //todo: how to resize now?
    //window.addEventListener('resize', function() { Plotly.Plots.resize(gd); });
    tableDiv.innerHTML = getTable(graph_data[name]);
}
document.ondragover = function () {
    event.preventDefault();
    return false;
};
document.ondrop = function (e) {
    event.preventDefault();
    return false;
};

document.addEventListener('DOMContentLoaded', function () {
    var first = document.getElementById('first');
    var second = document.getElementById('second');
    first.ondragover = function () {
      return false;
    };
    first.ondragleave = first.ondragend = function () {
      return false;
    };

    first.ondrop = function (e) {
      e.preventDefault();
      var file = e.dataTransfer.files[0];
      first_file = {path: file.path, name: file.name};
      processFile(first_file, 'graph1', first);
      return false;
    };
    second.ondragover = function () {
      return false;
    };
    second.ondragleave = second.ondragend = function () {
    return false;
    };
    second.ondrop = function (e) {
      e.preventDefault();
      var file = e.dataTransfer.files[0];
      second_file = {path: file.path,name: file.name};
      processFile(second_file, 'graph2', second);
      return false;
    };

    ipcRenderer.on('reprocess', function(event, c) {
        config = c;
        logger.info('received reprocess request from main');
        if(first_file.path) {
            processFile(first_file, 'graph1', first);
        }
        if(second_file.path) {
            processFile(second_file, 'graph2', second);
        }
    });
  });
  
