var {formatDate, getAverageFromArray} = require('./utils.js');
const logger = require('winston');

var initialise_data_dict = function() {
    var data_dict = {}
    
    data_dict.time = [];
    data_dict.temperature = [];
    data_dict.humidity = [];
    data_dict.dew_point = [];
    data_dict.data_entries = [];
    data_dict.timeCooling = 0;
    data_dict.timeAbove = 0;
    data_dict.timeBelow = 0;
    data_dict.sampleTime = 0;
    return data_dict;
}

var sliceDataDictArrays = function(data_dict, start_index, end_index) {
    data_dict.data_entries = data_dict.data_entries.slice(start_index, end_index);
    return data_dict;
}

var processDataEntry = function(data_entries, temperature, humidity, time, dew_point, max_temp, min_temp) {
    var data = {};
    data.temperature = temperature;
    data.humidity = humidity;
    data.dew_point = dew_point;
    
    if(data.temperature < max_temp && data.temperature > min_temp) {
        //todo better name
        data.currDate = formatDate(time);
        data.timeStep = data_entries.length ? data.currDate.diff(data_entries[data_entries.length-1].currDate) : 0;
        data_entries.push(data);
    }
    return data_entries;
}


var computeData = function(data_entries, pivot, startTime = 0, endTime = 0) {

    logger.info("ComputeData with pivot", pivot);
    console.log("ComputeData with pivot", pivot);
    var data_dict = initialise_data_dict();
    data_dict.data_entries = data_entries;
    var startIndex = 0;
    var endIndex = data_dict.data_entries.length;

    if( endIndex == 0 ) {
        logger.error("Wooh there, how did this happen?");
        throw Error("Invalid data_dict passed to computeData")
    }
    if( startTime ) {
        //find the first entry to process
        logger.info( "Trimming data range to start at: " + startTime );
        for( var index = 0; index < data_dict.data_entries.length; index++) {
            if(startTime.isBefore(data_dict.data_entries[index].currDate)) {
                logger.info('Starting at index ' + index + ', time: ' + data_dict.data_entries[index].currDate);
                startIndex = index;
                break;
            }
        }
    }
    if( endTime ) {
        //find the first entry to process
        logger.info("Trimming data range to end at: " + endTime);
        for( var index = 0; index < data_dict.data_entries.length; index++) {
            if(endTime.isBefore(data_dict.data_entries[index].currDate)) {
                logger.info('Ending at index ' + index + ', time: ' + data_dict.data_entries[index].currDate);
                endIndex = index;
                break;
            }
        }
    }
    //todo: deep copy? reduced_data_dict = JSON.parse(JSON.stringify(data_dict));
    var reduced_data_dict = sliceDataDictArrays(data_dict, startIndex, endIndex);

    //recalulate above/below if pivot changed.


    logger.debug('length ' + reduced_data_dict.data_entries.length);
    logger.debug('Ending at ' + reduced_data_dict.data_entries[reduced_data_dict.data_entries.length-1].currDate);
    logger.debug('starting at ' + reduced_data_dict.data_entries[0].currDate);
    reduced_data_dict.sampleTime = reduced_data_dict.data_entries[reduced_data_dict.data_entries.length-1].currDate.diff(reduced_data_dict.data_entries[0].currDate);

    reduced_data_dict.timeCooling = 0;
    reduced_data_dict.timeAbove = 0;
    reduced_data_dict.timeBelow = 0;
    reduced_data_dict.humidity = [];
    reduced_data_dict.dew_point = [];
    reduced_data_dict.time = [];
    reduced_data_dict.temperature = [];


    for(var index = 0; index < reduced_data_dict.data_entries.length; index++) {
        reduced_data_dict.time.push(reduced_data_dict.data_entries[index].currDate.format());
        reduced_data_dict.temperature.push(reduced_data_dict.data_entries[index].temperature);
        reduced_data_dict.humidity.push(reduced_data_dict.data_entries[index].humidity);
        reduced_data_dict.dew_point.push(reduced_data_dict.data_entries[index].dew_point);
        if(index > 0) {
            if( reduced_data_dict.data_entries[index].temperature < reduced_data_dict.data_entries[index-1].temperature ) {
                reduced_data_dict.timeCooling += reduced_data_dict.data_entries[index].timeStep;
            }
            if( reduced_data_dict.data_entries[index].temperature > pivot ) {
                reduced_data_dict.timeAbove += reduced_data_dict.data_entries[index].timeStep;
            }
            else if( reduced_data_dict.data_entries[index].temperature < pivot ) {
                reduced_data_dict.timeBelow += reduced_data_dict.data_entries[index].timeStep;
            }
        }
    }

    reduced_data_dict.humidity_average = getAverageFromArray(reduced_data_dict.humidity);
    reduced_data_dict.dew_point_average = getAverageFromArray(reduced_data_dict.dew_point);
    logger.debug("time cooling " + reduced_data_dict.timeCooling);
    logger.debug("timeAbove " + reduced_data_dict.timeAbove);
    logger.debug("timeBelow " + reduced_data_dict.timeBelow);
    logger.debug("humidity_average " + reduced_data_dict.humidity_average);
    logger.debug("dew_point_average " + reduced_data_dict.dew_point_average);
    logger.debug("sampleTime " + reduced_data_dict.sampleTime);
    logger.debug("sampleTime " + reduced_data_dict.sampleTime);
    reduced_data_dict.cooling_percentage = ((reduced_data_dict.timeCooling / reduced_data_dict.sampleTime) * 100).toFixed(2);
    reduced_data_dict.above_pivot_percentage = ((reduced_data_dict.timeAbove / reduced_data_dict.sampleTime) * 100).toFixed(2);
    reduced_data_dict.below_pivot_percentage = ((reduced_data_dict.timeBelow / reduced_data_dict.sampleTime) * 100).toFixed(2);

    return reduced_data_dict;
}

module.exports = {
    processDataEntry: processDataEntry,
    initialise_data_dict: initialise_data_dict,
    computeData: computeData
};