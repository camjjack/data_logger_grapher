const electron = require('electron');
var fs = require('fs');
const importFile = require( './import.js' );
var importExcel = importFile.importExcel;
var importCSV = importFile.importCSV;

const remote = electron.remote;
const dialog = electron.remote.dialog;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const menu = require('./menu.js');
var configuration = require('./configuration.js');
var config = configuration.config;
const ipcRenderer = electron.ipcRenderer;

Menu.setApplicationMenu(Menu.buildFromTemplate(menu.menuTemplate));

var graph_data = {};
var first_file = {};
var second_file = {};

var getTable = function(name) {
    var data_dict = graph_data[name];
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
    console.log('file ' + file.path);

    if(file.name.endsWith('.xlsx')) {
       importExcel(file.path, config.max_temp, config.min_temp, config.pivot).then(function(xlsx_data_dict) {
            graph_data[file.name] = xlsx_data_dict;
            doGraph(file.name, graphDivName, tableDiv);
       }, function(error) {
           
           Materialize.toast(error, 10000);
           console.error("Failed to import csv", error);
       })
    }
    else {
       importCSV(file.path, config.max_temp, config.min_temp, config.pivot).then(function(csv_data_dict) {
            graph_data[file.name] = csv_data_dict;
            doGraph(file.name, graphDivName, tableDiv);
       }, function(error) {
           Materialize.toast(error, 10000);
           console.error("Failed to import csv", error);
       })
    }
}

var doGraph = function(name, graphDivName, tableDiv) {
    var data = [];

    var layout = {
      title: name.split(".")[0],
      xaxis: {
        showgrid: false,                  // remove the x-axis grid lines
      }
    };

    if(config.display_temp) {
        console.log("graphing with temp");
        data.push({
            x: graph_data[name].x_data,
            y: graph_data[name].y_data,
            name: 'temperature',
        });
        layout.yaxis = { title: "Temperature"};
    }
    if(config.display_humidity) {
        console.log("graphing with humidity");
        data.push({
            x: graph_data[name].x_data,
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
    console.log("data " + data[0]);
    var d3 = Plotly.d3;
    var gd3 = d3.select("div[id='" + graphDivName + "']");
    var gd = gd3.node();
    Plotly.newPlot(gd, data, layout);
    window.addEventListener('resize', function() { Plotly.Plots.resize(gd); });
    tableDiv.innerHTML = getTable(name);
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
        console.log('received reprocess');
        if(first_file.path) {
            processFile(first_file, 'graph1', first);
        }
        if(second_file.path) {
            processFile(second_file, 'graph2', second);
        }
    });
  });
  
