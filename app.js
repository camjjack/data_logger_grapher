const electron = require('electron');
var fs = require('fs');
var csv = require('fast-csv');
const remote = electron.remote;
const dialog = electron.remote.dialog;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const menu = require('./menu.js');
var configuration = require('./configuration.js');
var config = configuration.config.get();

const ipcRenderer = electron.ipcRenderer;

//setup initial configuration.
if (config.pivot === undefined) {
    configuration.config.set('pivot', 3.0);
}
if (config.max_temp === undefined) {
    configuration.config.set('max_temp', 10.0);
}
if (config.min_temp === undefined) {
    configuration.config.set('min_temp', -10.0);
}
if (config.display_temp === undefined) {
    configuration.config.set('display_temp', true);
}
if (config.display_humidity === undefined) {
    configuration.config.set('display_humidity', true);
}


Menu.setApplicationMenu(Menu.buildFromTemplate(menu.menuTemplate));


var graph_data = {};
var first_file = {};
var second_file = {};


var getAverageFromArray = function(a) {
    var sum = 0;
    for( var i = 0; i < a.length; i++ ){
        sum += parseInt( a[i], 10 );
    }
    return sum/a.length;
}
var getTable = function(name) {
    var data_dict = graph_data[name];
    var s = "<table class='striped'><thead><tr><th data-field='item' colspan='2' class='center-align'>" + name + "</th></tr></thead><tbody>";
    s += "<tr><th>Sample time</th><td>" + data_dict.sampleTime / 60000 + " minutes</td></tr>";
    s += "<tr><th>% time spent cooling</th><td>" + ((data_dict.cooling / data_dict.sampleTime) * 100).toFixed(2) + "</td></tr>";
    s += "<tr><th>% time above " + config.pivot + "&deg;C</th><td>" + ((data_dict.timeAbove / data_dict.sampleTime) * 100).toFixed(2) + "%</td></tr>";
    s += "<tr><th>% time below " + config.pivot + "&deg;C</th><td>" + ((data_dict.timeBelow / data_dict.sampleTime) * 100).toFixed(2) + "%</td></tr>";
    s += "<tr><th>Humidity average</th><td>" + getAverageFromArray(data_dict.humidity).toFixed(2) + "</td></tr>";
    s += "<tr><th>Dew point average</th><td>" + getAverageFromArray(data_dict.dew_point).toFixed(2) + "&deg;C</td></tr>";
    s += "</tbody></table>";
    return s;
}
var processFile = function(file, graphDivName, tableDiv) {
    console.log('file ' + file.path);
    var data_dict = {};
    data_dict.x_data = [];
    data_dict.y_data = [];
    data_dict.humidity = [];
    data_dict.dew_point = [];
    data_dict.cooling = 0;
    data_dict.timeAbove = 0;
    data_dict.timeBelow = 0;
    data_dict.coolingSince = 0;

    csv
     .fromPath(file.path, {headers : ["index", "time", "celsius", "humidity","dew_point", ,], ignoreEmpty: true})
        .on("data", function(data){

            if(data.celsius < config.max_temp && data.celsius > config.min_temp) {
                if( data_dict.x_data.length > 0) {
                        if( data_dict.coolingSince > 0 && data.celsius >= data_dict.y_data[data_dict.y_data.length-1]) {
                            //stopped cooling at the last poll
                            data_dict.cooling += new Date(data_dict.x_data[data_dict.x_data.length-1]) -data_dict.coolingSince;
                            data_dict.coolingSince = 0;
                        }
                        if( data_dict.coolingSince == 0 && data.celsius < data_dict.y_data[data_dict.y_data.length-1]) {
                            data_dict.coolingSince = new Date(data_dict.x_data[data_dict.x_data.length-1]);
                        }
                        if ( data.celsius > config.pivot) {
                            data_dict.timeAbove += (new Date(data.time) - new Date(data_dict.x_data[data_dict.x_data.length-1]));
                        }
                        if ( data.celsius < config.pivot) {
                            data_dict.timeBelow += (new Date(data.time) - new Date(data_dict.x_data[data_dict.x_data.length-1]));
                        }
                }
                 data_dict.x_data.push(data.time);
                 data_dict.y_data.push(data.celsius);
                 data_dict.humidity.push(data.humidity);
                 data_dict.dew_point.push(data.dew_point);
            }
        })
        .on("end", function(){
            data_dict.sampleTime = (new Date(data_dict.x_data[data_dict.x_data.length-1]) - new Date(data_dict.x_data[0]));
            console.log('cooling time: ', data_dict.cooling / 60000 + ' minutes');
            console.log('time above ' + config.pivot + ' degrees: ' +  data_dict.timeAbove / 60000 + ' minutes');
            console.log('time below ' + config.pivot + ' degrees: ' +  data_dict.timeBelow / 60000 + ' minutes');
            console.log('Sample time: ' + data_dict.sampleTime / 60000 + ' minutes');
            console.log('Percentage cooling:' + (data_dict.cooling / data_dict.sampleTime) * 100);
            graph_data[file.name] = data_dict;
            doGraph(file.name, graphDivName, tableDiv);
        });
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

        console.log('config.pivot ' + config);
        if(first_file.path) {
            processFile(first_file, 'graph1', first);
        }
        if(second_file.path) {
            processFile(second_file, 'graph2', second);
        }
    });
  });
