'use strict'

var logger = require('../log.js');
const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
var moment = require('moment');
chai.use(chaiAsPromised);
chai.should();
const path = require('path')
var importCSV = require( '../import.js' ).importCSV;
var computeData = require( '../data.js' ).computeData;

describe('(unit) example suite', () => {
  // Before test suite
  before((done) => {
    return done()
  })

  // Before each of the tests
  beforeEach((done) => {
    return done()
  })

  describe('Valid resize', () => {
    it('1.txt', function(done) {
        this.timeout(10000);
        importCSV(path.resolve(__dirname, 'data', '1.txt'), 10, -10, 3).then(function(csv_data_dict) {
            csv_data_dict.cooling_percentage.should.equal((8.57).toFixed(2));
            csv_data_dict.above_pivot_percentage.should.equal((99.85).toFixed(2));
            csv_data_dict.below_pivot_percentage.should.equal((0.13).toFixed(2));
            csv_data_dict.dew_point_average.should.equal((4.45).toFixed(2));
            csv_data_dict.humidity_average.should.equal((89.37).toFixed(2));
            csv_data_dict.timeCooling.should.equal(84240000);
            csv_data_dict.sampleTime.should.equal(982860000);

            var startTime = moment("2015-09-05 03:20:30");
            var endTime = moment("2015-09-10 06:10:30");
            var resized_data = computeData(csv_data_dict.data_entries, 3, startTime, endTime);
            logger.info('resized sample time', resized_data.sampleTime);
            
            importCSV(path.resolve(__dirname, 'data', '1-split.txt'), 10, -10, 3).then(function(pre_split_data_dict) {
                pre_split_data_dict.sampleTime.should.equal(resized_data.sampleTime);
                pre_split_data_dict.cooling_percentage.should.equal(resized_data.cooling_percentage);
                pre_split_data_dict.above_pivot_percentage.should.equal(resized_data.above_pivot_percentage);
                pre_split_data_dict.below_pivot_percentage.should.equal(resized_data.below_pivot_percentage);
                pre_split_data_dict.dew_point_average.should.equal(resized_data.dew_point_average);
                pre_split_data_dict.humidity_average.should.equal(resized_data.humidity_average);
                pre_split_data_dict.timeCooling.should.equal(resized_data.timeCooling);
                pre_split_data_dict.sampleTime.should.equal(resized_data.sampleTime);
                done();
            }, function(error) {
                logger.error("Failed to import csv", error);
                    done(error);
            });

            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    });
    
    });
  
  describe('Valid resize and revert', () => {
    it('1.txt', function(done) {
        this.timeout(20000);
        importCSV(path.resolve(__dirname, 'data', '1.txt'), 10, -10, 3).then(function(csv_data_dict) {

            var startTime = moment("2015-09-05 03:20:30");
            var endTime = moment("2015-09-10 06:10:30");
            var resized_data = computeData(csv_data_dict.data_entries, 3, startTime, endTime);
            
            csv_data_dict.start_time = 0;
            csv_data_dict.end_time = 0;
            var full_data_dict =  computeData(csv_data_dict.data_entries, 3, 0, 0);
            full_data_dict.sampleTime.should.equal(csv_data_dict.sampleTime);
            full_data_dict.cooling_percentage.should.equal(csv_data_dict.cooling_percentage);
            full_data_dict.above_pivot_percentage.should.equal(csv_data_dict.above_pivot_percentage);
            full_data_dict.below_pivot_percentage.should.equal(csv_data_dict.below_pivot_percentage);
            full_data_dict.dew_point_average.should.equal(csv_data_dict.dew_point_average);
            full_data_dict.humidity_average.should.equal(csv_data_dict.humidity_average);
            full_data_dict.timeCooling.should.equal(csv_data_dict.timeCooling);
            full_data_dict.sampleTime.should.equal(csv_data_dict.sampleTime);
            done();
            
            
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    });
    
    });

  // After each of the tests
  afterEach((done) => {
    done()
  })

  // At the end of all
  after((done) => {
    done()
  })
})