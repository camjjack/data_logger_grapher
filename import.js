var csv = require('fast-csv');
var {matchInStringArray} = require('./utils.js');
var {processDataEntry, computeData} = require('./data.js');
const logger = require('winston');
const XlsxExtractor = require( 'xlsx-extractor' );

//todo. make these settings.
var tempNames = ['celsius', 'temp'];
var humidityNames = ['hum'];
var timeNames = ['time', 'date'];
var dewPointNames = ['dew point'];


var importExcel = function(file_path, max_temp, min_temp, pivot) {
    var data_entries = [];

    return new Promise(function(resolve, reject) {
        logger.info('Importing xlsx from ' + file_path);
        const extractor = new XlsxExtractor( file_path );
        const tasks     = [];
        for( let i = 1, max = extractor.count; i <= max; ++i ) {
        tasks.push( extractor.extract( i ) );
        }
        var temperatureCell = -1;
        var humidityCell = -1;
        var timeCell = -1;
        var dewPointCell = -1;

        Promise
        .all( tasks )
        .then( ( results ) => {
        for(var i = 0; i < results[0].cells[0].length; i++ ) {
            if(matchInStringArray(results[0].cells[0][i], tempNames)) {
                temperatureCell = i;
                logger.debug("temperatureCell = " + i );
            }
            else if(matchInStringArray(results[0].cells[0][i], humidityNames)) {
                humidityCell = i;
                logger.debug("humidityCell = " + i );
            }
            else if(matchInStringArray(results[0].cells[0][i], timeNames)) {
                timeCell = i;
                logger.debug("timeCell = " + i );
            }
            else if(matchInStringArray(results[0].cells[0][i], dewPointNames)) {
                dewPointCell = i;
                logger.debug("dewPointCell = " + i );
            }
        }
        //required columns
        if( temperatureCell == -1 ) {
            logger.error("Couldn't find temperature column in file");
            reject(Error("Data import Error. Couldn't find temperature column in file"));
        }
        if( timeCell == -1) {
            logger.error("Couldn't find time/date column in file");
            reject(Error("Data import Error. Couldn't find time/date column in file"));
        }

        for(var i = 1; i < results[0].cells.length; i++ ) {
            var temperature = parseFloat(results[0].cells[i][temperatureCell]);
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
            var time = new Date(out.y, out.m, out.d, out.H, out.M, out.S);
            var humidity = parseFloat(results[0].cells[i][humidityCell]);
            var dew_point = parseFloat(results[0].cells[i][dewPointCell]);
            data_entries = processDataEntry(data_entries, temperature, humidity, time, dew_point, max_temp, min_temp);
        }

        var data_dict = computeData(data_entries, pivot);
        resolve(data_dict);

        } )
        .catch( ( err ) => {
            logger.error( err );
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

    logger.info("validating  keys", validated_keys);
    //required columns
    if( validated_keys.temp == -1 ) {
        throw "Couldn't find temperature column in file";
    }
    if( validated_keys.time == -1 ) {
        throw "Couldn't find time/date column in file";
    }
    logger.info("correctly validated keys");
	return validated_keys; 
}

var importCSV = function(file_path, max_temp, min_temp, pivot) {
    return new Promise(function(resolve, reject) {
    var headingsValidated = false;
    var headingsValid = false;
    var data_entries = [];
    var keys = null;

        logger.info('Importing CSV from ' + file_path);

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
            var temperature = parseFloat(raw_data[keys.temp]);
            var humidity = keys.humidity != -1 ? parseFloat(raw_data[keys.humidity]) : NaN;
            var time = raw_data[keys.time];
            var dew_point = keys.dew_point != -1 ? parseFloat(raw_data[keys.dew_point]) : NaN;
            
            data_entries = processDataEntry( data_entries, temperature, humidity, time, dew_point, max_temp, min_temp);
           logger.debug("data entries length: " + data_entries.length);
        })
        .on("end", function(){
            if( keys ) {
                logger.debug("data entries final length: " + data_entries.length);
            
                var data_dict = computeData(data_entries, pivot);
                
                if( keys.humidity == -1 ) {
                    logger.debug("data entries after length: " + data_dict.data_entries.length);
                }
                logger.debug("End of import, sampleTime = " + data_dict.sampleTime);
                if(data_dict.sampleTime > 0) {
                    logger.silly(data_dict);
                    resolve(data_dict);
                }
                else if ( headingsValid ){
                    logger.error("Data import Error, sampleTime == 0");
                    reject(Error("Data import Error"));
                }
            }
            //else: already rejected
        }).on("data-invalid", function(){
            //ignore
        }).on("error", function(error){
            logger.error("Error importing CSV:" + error);
            reject(new Error("Error importing CSV"));
        });
    })
}

module.exports = {
    importExcel: importExcel,
    importCSV: importCSV
};