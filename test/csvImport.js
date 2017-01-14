'use strict'

var logger = require('../log.js');
const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
const path = require('path');
const importFile = require( '../import.js' );
var importCSV = importFile.importCSV;

describe('(unit) example suite', () => {
  // Before test suite
  before((done) => {
    return done()
  })

  // Before each of the tests
  beforeEach((done) => {
    return done()
  })

  describe('Valid csv', () => {
    it('1.txt', function(done) {
        this.timeout(30000);
        importCSV(path.resolve(__dirname, 'data', '1.txt'), 10, -10, 3).then(function(csv_data_dict) {
            csv_data_dict.cooling_percentage.should.equal((8.57).toFixed(2));
            csv_data_dict.above_pivot_percentage.should.equal((99.85).toFixed(2));
            csv_data_dict.below_pivot_percentage.should.equal((0.13).toFixed(2));
            csv_data_dict.dew_point_average.should.equal((4.45).toFixed(2));
            csv_data_dict.humidity_average.should.equal((89.37).toFixed(2));
            csv_data_dict.timeCooling.should.equal(84240000);
            csv_data_dict.sampleTime.should.equal(982860000);
            done();
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    }),
    it('2.txt', function(done) {
        this.timeout(30000);
        importCSV(path.resolve(__dirname, 'data', '2.txt'), 10, -10, 3).then(function(csv_data_dict) {
            csv_data_dict.cooling_percentage.should.equal((3.89).toFixed(2));
            csv_data_dict.above_pivot_percentage.should.equal((100).toFixed(2));
            csv_data_dict.below_pivot_percentage.should.equal((0.00).toFixed(2));
            csv_data_dict.dew_point_average.should.equal((3.68).toFixed(2));
            csv_data_dict.humidity_average.should.equal((87.60).toFixed(2));
            csv_data_dict.timeCooling.should.equal(29160000);
            csv_data_dict.sampleTime.should.equal(749940000);
            done();
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    }),
    it('3.txt', function(done) {
        this.timeout(30000);
        importCSV(path.resolve(__dirname, 'data', '3.txt'), 10, -10, 3).then(function(csv_data_dict) {
            csv_data_dict.cooling_percentage.should.equal((3.37).toFixed(2));
            csv_data_dict.above_pivot_percentage.should.equal((0).toFixed(2));
            csv_data_dict.below_pivot_percentage.should.equal((94.23).toFixed(2));
            csv_data_dict.dew_point_average.should.equal((-0.37).toFixed(2));
            csv_data_dict.humidity_average.should.equal((80.91).toFixed(2));
            csv_data_dict.timeCooling.should.equal(840000);
            csv_data_dict.sampleTime.should.equal(24960000);
            done();
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    }),
    it('5 - renamed headings', function(done) {
        this.timeout(30000);
        importCSV(path.resolve(__dirname, 'data', '5.csv'), 10, -10, 3).then(function(csv_data_dict) {
            importCSV(path.resolve(__dirname, 'data', '5_renamed_headings.csv'), 10, -10, 3).then(function(renamed_data_dict) {
              csv_data_dict.cooling_percentage.should.equal(renamed_data_dict.cooling_percentage);
              csv_data_dict.above_pivot_percentage.should.equal(renamed_data_dict.above_pivot_percentage);
              csv_data_dict.below_pivot_percentage.should.equal(renamed_data_dict.below_pivot_percentage);
              csv_data_dict.dew_point_average.should.equal(renamed_data_dict.dew_point_average);
              //csv_data_dict.humidity_average.should.equal(renamed_data_dict.humidity_average);
              csv_data_dict.timeCooling.should.equal(renamed_data_dict.timeCooling);
              csv_data_dict.sampleTime.should.equal(renamed_data_dict.sampleTime);
              done();    
            }, function(error) {
                logger.error("Failed to import csv", error);
                  done(error);
            });
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    })


  // add other tests...
  });

  // add other features...

  describe('Invalid csv', () => {
    it('should pass', function(done) {
        this.timeout(3000);
        importCSV(path.resolve(__dirname, 'data', '4.xlsx'), 10, -10, 3).should.be.rejected;
        done();
       
    }),

    it('should pass', function(done) {
        this.timeout(3000);
        importCSV(path.resolve(__dirname, 'data', '5_no_temperature.csv'), 10, -10, 3).should.be.rejected;
        done();
       
  });
  });
  
  describe('No Humidity', () => {
    it('should pass', function(done) {
        this.timeout(30000);
        importCSV(path.resolve(__dirname, 'data', '5_no_humidity.csv'), 10, -25, -15).then(function(hum_data_dict) {
            hum_data_dict.cooling_percentage.should.equal((8.86).toFixed(2));
            hum_data_dict.above_pivot_percentage.should.equal((22.23).toFixed(2));
            hum_data_dict.below_pivot_percentage.should.equal((70.76).toFixed(2));
            hum_data_dict.dew_point_average.should.be.NaN;
            hum_data_dict.humidity_average.should.be.NaN;
            hum_data_dict.timeCooling.should.equal(43560000);
            hum_data_dict.sampleTime.should.equal(491700000);
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