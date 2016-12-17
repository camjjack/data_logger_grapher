const electron = require('electron');
var fs = require('fs');
var csv = require('fast-csv');
var moment = require('moment');
const util = require('util');
const XlsxExtractor = require( 'xlsx-extractor' );
const remote = electron.remote;
const dialog = electron.remote.dialog;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;
const menu = require('./menu.js');
var configuration = require('./configuration.js');
var config = configuration.config.get();

var data_dict = {};

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
    s += "<tr><th>% time spent cooling</th><td>" + ((data_dict.cooling / data_dict.sampleTime) * 100).toFixed(2) + "%</td></tr>";
    s += "<tr><th>% time above " + config.pivot + "&deg;C</th><td>" + ((data_dict.timeAbove / data_dict.sampleTime) * 100).toFixed(2) + "%</td></tr>";
    s += "<tr><th>% time below " + config.pivot + "&deg;C</th><td>" + ((data_dict.timeBelow / data_dict.sampleTime) * 100).toFixed(2) + "%</td></tr>";
    s += "<tr><th>Humidity average</th><td>" + getAverageFromArray(data_dict.humidity).toFixed(2) + "</td></tr>";
    s += "<tr><th>Dew point average</th><td>" + getAverageFromArray(data_dict.dew_point).toFixed(2) + "&deg;C</td></tr>";
    s += "</tbody></table>";
    return s;
}
var formatDate = function(dateString) {
  x = moment(dateString, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY H:mm', 'YYYY-MM-DD HH:mm:ss']);
  if(!x.isValid()) {
    console.log("doing non dd/mm: ", dateString);
    x = moment(dateString);
    console.log(x)
  }
  return x;
}

var processDataEntry = function(data) {
    currDate = formatDate(data.time);
    if(data.celsius < config.max_temp && data.celsius > config.min_temp) {
        if( data_dict.x_data.length > 0) {
                if( data_dict.coolingSince > 0 && data.celsius >= data_dict.y_data[data_dict.y_data.length-1]) {
                    //stopped cooling at the last poll
                    data_dict.cooling += currDate -data_dict.coolingSince;
                    data_dict.coolingSince = 0;
                }
                if( data_dict.coolingSince == 0 && data.celsius < data_dict.y_data[data_dict.y_data.length-1]) {
                    data_dict.coolingSince = currDate;
                }
                prevDate = formatDate(data_dict.x_data[data_dict.x_data.length-1]);
                if ( data.celsius > config.pivot) {

                    data_dict.timeAbove += (currDate - prevDate);
                }
                if ( data.celsius < config.pivot) {
                    data_dict.timeBelow += (currDate - prevDate);
                }
        }
         data_dict.x_data.push(data.time);
         data_dict.y_data.push(data.celsius);
         data_dict.humidity.push(data.humidity);
         data_dict.dew_point.push(data.dew_point);
    }
}

var processFile = function(file, graphDivName, tableDiv) {
    console.log('file ' + file.path);
    data_dict.x_data = [];
    data_dict.y_data = [];
    data_dict.humidity = [];
    data_dict.dew_point = [];
    data_dict.cooling = 0;
    data_dict.timeAbove = 0;
    data_dict.timeBelow = 0;
    data_dict.coolingSince = 0;

    if(file.name.endsWith('.xlsx')) {

      const extractor = new XlsxExtractor( file.path );
      const tasks     = [];
      for( let i = 1, max = extractor.count; i <= max; ++i ) {
        tasks.push( extractor.extract( i ) );
      }

      Promise
      .all( tasks )
      .then( ( results ) => {
        console.log(results[0].cells[0] );
        for(var i = 0; i < results[0].cells[0].length; i++ ) {
            if(results[0].cells[0][i].match(/celsius/i)) {
              celsiusCell = i;
              console.log("celsiusCell = " + i );
            }
            else if(results[0].cells[0][i].match(/time/i)) {
              timeCell = i;
              console.log("timeCell = " + i );
            }
            else if(results[0].cells[0][i].match(/humidity/i)) {
              humidityCell = i;
              console.log("humidityCell = " + i );
            }
        }
       for(var i = 1; i < results[0].cells.length; i++ ) {
          var data = {};
          data.celsius = parseFloat(results[0].cells[i][celsiusCell]);
          var v= results[0].cells[i][timeCell];
          var date = (v|0), time = Math.floor(86400 * (v - date)), dow=0;
          var dout=[];
           var out={D:date, T:time, u:86400*(v-date)-time,y:0,m:0,d:0,H:0,M:0,S:0,q:0};
          if(out.u > 0.999) {
        		out.u = 0;
        		if(++time == 86400) { time = 0; ++date; }
        	}
          if(date > 60) --date;
      		/* 1 = Jan 1 1900 */
      		var d = new Date(1900,0,1);
      		d.setDate(d.getDate() + date - 1);
      		dout = [d.getFullYear(), d.getMonth()+1,d.getDate()];
      		dow = d.getDay();
      		if(date < 60) dow = (dow + 6) % 7;
          out.y = dout[0]; out.m = dout[1]-1; out.d = dout[2];
        	out.S = time % 60; time = Math.floor(time / 60);
        	out.M = time % 60; time = Math.floor(time / 60);
        	out.H = time;
        	out.q = dow;
          data.time = new Date(out.y, out.m, out.d, out.H, out.M, out.S);
          data.humidity = parseFloat(results[0].cells[i][humidityCell]);
          processDataEntry(data);
        }
        data_dict.sampleTime = formatDate(data_dict.x_data[data_dict.x_data.length-1]) - formatDate(data_dict.x_data[0]);
        console.log('end time: ' + formatDate(data_dict.x_data[data_dict.x_data.length-1]))
        console.log('start time: ' +  formatDate(data_dict.x_data[0]));
        console.log('cooling time: ', data_dict.cooling / 60000 + ' minutes');
        console.log('time above ' + config.pivot + ' degrees: ' +  data_dict.timeAbove / 60000 + ' minutes');
        console.log('time below ' + config.pivot + ' degrees: ' +  data_dict.timeBelow / 60000 + ' minutes');
        console.log('Sample time: ' + data_dict.sampleTime / 60000 + ' minutes');
        console.log('Percentage cooling:' + (data_dict.cooling / data_dict.sampleTime) * 100);
        graph_data[file.name] = data_dict;
        doGraph(file.name, graphDivName, tableDiv);

      } )
      .catch( ( err ) => {
        console.error( err );
      } );
    }
    else {
      console.log('config.max_temp ' + config.max_temp);
        console.log('config.min_temp ' + config.min_temp);
      csv
       .fromPath(file.path, {headers : ["index", "time", "celsius", "humidity","dew_point", ,,,,,,,,,,,,,,,,,,,,], ignoreEmpty: true})
          .on("data", function(data){
            if(!data.celsius.match(/celsius/i) == true && data.time) {
                data.celsius = parseFloat(data.celsius);
                data.humidity = parseFloat(data.humidity);
                processDataEntry(data);
            }
          })
          .on("end", function(){
              data_dict.sampleTime = formatDate(data_dict.x_data[data_dict.x_data.length-1]) - formatDate(data_dict.x_data[0]);
              console.log('end time: ' + formatDate(data_dict.x_data[data_dict.x_data.length-1]))
              console.log('start time: ' +  formatDate(data_dict.x_data[0]));
              console.log('cooling time: ', data_dict.cooling / 60000 + ' minutes');
              console.log('time above ' + config.pivot + ' degrees: ' +  data_dict.timeAbove / 60000 + ' minutes');
              console.log('time below ' + config.pivot + ' degrees: ' +  data_dict.timeBelow / 60000 + ' minutes');
              console.log('Sample time: ' + data_dict.sampleTime / 60000 + ' minutes');
              console.log('Percentage cooling:' + (data_dict.cooling / data_dict.sampleTime) * 100);
              graph_data[file.name] = data_dict;
              doGraph(file.name, graphDivName, tableDiv);
          });
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
