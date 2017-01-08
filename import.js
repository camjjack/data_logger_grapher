
var csv = require('fast-csv');
var moment = require('moment');
const XlsxExtractor = require( 'xlsx-extractor' );

var formatDate = function(dateString) {
  x = moment(dateString, ['DD/MM/YYYY HH:mm', 'DD/MM/YYYY H:mm', 'YYYY-MM-DD HH:mm:ss']);
  if(!x.isValid()) {
    console.log("doing non dd/mm: ", dateString);
    x = moment(dateString);
    console.log(x)
  }
  return x;
}

var initialise_data_dict = function() {
    var data_dict = {}
    data_dict.x_data = [];
    data_dict.y_data = [];
    data_dict.humidity = [];
    data_dict.dew_point = [];
    data_dict.cooling = 0;
    data_dict.timeAbove = 0;
    data_dict.timeBelow = 0;
    data_dict.coolingSince = 0;
    data_dict.sampleTime = 0;
    return data_dict;
}

var processDataEntry = function(data, data_dict, max_temp, min_temp, pivot) {
    
    currDate = formatDate(data.time);
    if(data.celsius < max_temp && data.celsius > min_temp) {
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
                if ( data.celsius > pivot) {

                    data_dict.timeAbove += (currDate - prevDate);
                }
                if ( data.celsius < pivot) {
                    data_dict.timeBelow += (currDate - prevDate);
                }
        }
         data_dict.x_data.push(data.time);
         data_dict.y_data.push(data.celsius);
         if(data.humidity != undefined ) {
            data_dict.humidity.push(data.humidity);
         }
         if(data.dew_point != undefined ) {
            data_dict.dew_point.push(data.dew_point);
         }
    }
    return data_dict;
}

var getAverageFromArray = function(a) {
    var sum = 0;
    for( var i = 0; i < a.length; i++ ){
        sum += parseInt( a[i], 10 );
    }
    return (sum/a.length).toFixed(2);
}

var computeData = function(data_dict) {
    data_dict.sampleTime = formatDate(data_dict.x_data[data_dict.x_data.length-1]) - formatDate(data_dict.x_data[0]);
    data_dict.humidity_average = getAverageFromArray(data_dict.humidity);
    data_dict.dew_point_average = getAverageFromArray(data_dict.dew_point);
    data_dict.cooling_percentage = ((data_dict.cooling / data_dict.sampleTime) * 100).toFixed(2);
    data_dict.above_pivot_percentage = ((data_dict.timeAbove / data_dict.sampleTime) * 100).toFixed(2);
    data_dict.below_pivot_percentage = ((data_dict.timeBelow / data_dict.sampleTime) * 100).toFixed(2);

    return data_dict;
}


var tempNames = ['celsius', 'temp'];
var humidityNames = ['hum'];
var timeNames = ['time', 'date'];
var dewPointNames = ['dew point'];

function matchInStringArray(item, stringArray) {
    for( var index in stringArray) {
        if( item.toLowerCase().match(stringArray[index].toLowerCase()) ) {
            return true;
        }
    }
    return false;
}

var importExcel = function(file_path, max_temp, min_temp, pivot) {
    var data_dict = initialise_data_dict();
    
    return new Promise(function(resolve, reject) {
        console.log('Importing xlsx from ' + file_path);
        const extractor = new XlsxExtractor( file_path );
        const tasks     = [];
        for( let i = 1, max = extractor.count; i <= max; ++i ) {
        tasks.push( extractor.extract( i ) );
        }
        var celsiusCell = -1;
        var humidityCell = -1;
        var timeCell = -1;
        var dewPointCell = -1;

        Promise
        .all( tasks )
        .then( ( results ) => {
        console.log(results[0].cells[0] );
        for(var i = 0; i < results[0].cells[0].length; i++ ) {
            if(matchInStringArray(results[0].cells[0][i], tempNames)) {
                celsiusCell = i;
                console.log("celsiusCell = " + i );
            }
            else if(matchInStringArray(results[0].cells[0][i], humidityNames)) {
                humidityCell = i;
                console.log("humidityCell = " + i );
            }
            else if(matchInStringArray(results[0].cells[0][i], timeNames)) {
                timeCell = i;
                console.log("timeCell = " + i );
            }
            else if(matchInStringArray(results[0].cells[0][i], dewPointNames)) {
                dewPointCell = i;
                console.log("dewPointCell = " + i );
            }
        }
        //required columns
        if( celsiusCell == -1 ) {
            console.error("Couldn't find temperature column in file");
            reject(Error("Data import Error. Couldn't find temperature column in file"));
        }
        if( timeCell == -1) {
            console.error("Couldn't find time/date column in file");
            reject(Error("Data import Error. Couldn't find time/date column in file"));
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
            data.dew_point = parseFloat(results[0].cells[i][dewPointCell]);
            data_dict = processDataEntry(data, data_dict, max_temp, min_temp, pivot);
        }

        data_dict = computeData(data_dict);
        resolve(data_dict);

        } )
        .catch( ( err ) => {
            console.error( err );
            reject(Error("Data import Error"));
        } );
    })

}

function validateHeaders(headers) {
    var validated_keys = {};
    validated_keys.temp = -1;
    validated_keys.humidity = -1;
    validated_keys.time = -1;
    validated_keys.dew_point = -1;

    var header_keys = Object.getOwnPropertyNames(headers);
    for( var i=0; i < header_keys.length; i++) {
        //temp
        if( validated_keys.temp == -1 ) {
            validated_keys.temp = matchInStringArray( header_keys[i], tempNames) ? header_keys[i] : -1;
        }
        if( validated_keys.humidity == -1 ) {
            validated_keys.humidity = matchInStringArray( header_keys[i], humidityNames) ? header_keys[i] : -1;
        }
        if( validated_keys.time == -1 ) {
            validated_keys.time = matchInStringArray( header_keys[i], timeNames) ? header_keys[i] : -1;
        }
        if( validated_keys.dew_point == -1 ) {
            validated_keys.dew_point = matchInStringArray( header_keys[i], dewPointNames) ? header_keys[i] : -1;
        }
    }

    console.log("validated_keys", validated_keys);
    //required columns
    if( validated_keys.temp == -1 ) {
        throw "Couldn't find temperature column in file";
    }
    if( validated_keys.time == -1 ) {
        throw "Couldn't find time/date column in file";
    }
	return validated_keys; 
}

var importCSV = function(file_path, max_temp, min_temp, pivot) {
    var data_dict = initialise_data_dict();
    var headingsValidated = false;
    var headingsValid = false;
    var keys = null;
    return new Promise(function(resolve, reject) {

        console.log('Importing CSV from ' + file_path);

        csv
        .fromPath(file_path, {headers : true, ignoreEmpty: true, discardUnmappedColumns: true})
        .validate(function(raw_data){
            if(headingsValidated == false) {
                try {
                    headingsValidated = true;
                    keys = validateHeaders(raw_data);
                    headingsValid = true;
                }
                catch(err) {
                    reject(Error(err));
                }
            }
            return keys != null;
        })
        .on("data", function(raw_data){
            var data = {};
            data.celsius = parseFloat(raw_data[keys.temp]);
            data.humidity = parseFloat(raw_data[keys.humidity]);
            data.time = raw_data[keys.time];
            data.dew_point = parseFloat(raw_data[keys.dew_point]);
            data_dict = processDataEntry(data, data_dict, max_temp, min_temp, pivot);
        })
        .on("end", function(){
            data_dict = computeData(data_dict);
            console.log("End of import, sampleTime = " + data_dict.sampleTime);
            if(data_dict.sampleTime > 0) {
                data_dict = computeData(data_dict);
                console.log(data_dict);
                resolve(data_dict);
            }
            else if ( headingsValid ){
                console.error("Data import Error, sampleTime == 0");
                reject(Error("Data import Error"));
            }
            //else: already rejected
        }).on("data-invalid", function(data){
            //ignore
        });
    })
}

module.exports = {
    importExcel: importExcel,
    importCSV: importCSV
};