'use strict'
var logger = require('../log.js');

const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
const path = require('path');
const importFile = require( '../import.js' );
var importCSV = importFile.importCSV;
var importExcel = importFile.importExcel;

describe('(unit) example suite', () => {
  // Before test suite
  before((done) => {
    return done()
  })

  // Before each of the tests
  beforeEach((done) => {
    return done()
  })

  describe('Valid xlsx', () => {
    it('should pass', function(done) {
        this.timeout(30000);
        importExcel(path.resolve(__dirname, 'data', '4.xlsx'), 10, -25, -15).then(function(xlstime_dict) {
            xlstime_dict.cooling_percentage.should.equal((3.89).toFixed(2));
            xlstime_dict.above_pivot_percentage.should.equal((21.51).toFixed(2));
            xlstime_dict.below_pivot_percentage.should.equal((72.52).toFixed(2));
            xlstime_dict.dew_point_average.isNan;
            xlstime_dict.humidity_average.should.equal((71.04).toFixed(2));
            xlstime_dict.timeCooling.should.equal(19140000);
            xlstime_dict.sampleTime.should.equal(491940000);
            done();
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    }),
    
    it('should pass', function(done) {
        this.timeout(30000);
        importExcel(path.resolve(__dirname, 'data', '6.xlsx'), 10, -10, 3).then(function(xlstime_dict) {
            xlstime_dict.cooling_percentage.should.equal((3.94).toFixed(2));
            xlstime_dict.above_pivot_percentage.should.equal((26.38).toFixed(2));
            xlstime_dict.below_pivot_percentage.should.equal((45.78).toFixed(2));
            xlstime_dict.dew_point_average.should.equal((0.07).toFixed(2));
            xlstime_dict.humidity_average.should.equal((81.74).toFixed(2));
            xlstime_dict.timeCooling.should.equal(23820000);
            xlstime_dict.sampleTime.should.equal(604140000);
            done();
         }, function(error) {
              logger.error("Failed to import xlsx", error);
              done(error);
        });
       
    });

  // add other tests...
  });
  
  describe('Comparisons', () => {
    
    it('should pass', function(done) {
        this.timeout(30000);
        importExcel(path.resolve(__dirname, 'data', '4.xlsx'), 10, -10, 3).then(function(xlstime_dict) {
          importCSV(path.resolve(__dirname, 'data', '4.csv'), 10, -10, 3).then(function(csv_data_dict) {
            csv_data_dict.cooling_percentage.should.equal(xlstime_dict.cooling_percentage);
            csv_data_dict.above_pivot_percentage.should.equal(xlstime_dict.above_pivot_percentage);
            csv_data_dict.below_pivot_percentage.should.equal(xlstime_dict.below_pivot_percentage);
            csv_data_dict.humidity_average.should.equal(xlstime_dict.humidity_average);
            csv_data_dict.timeCooling.should.equal(xlstime_dict.timeCooling);
            csv_data_dict.sampleTime.should.equal(xlstime_dict.sampleTime);
            done();
         }, function(error) {
              logger.error("Failed to import xlsx", error);
              done(error);
         });
            
       }, function(error) {
           logger.error("Failed to import csv", error);
            done(error);
       });
       
    });

  });

  describe('Invalid  xlsx', () => {
    
    it('should pass', function(done) {
        importExcel(path.resolve(__dirname, 'data', '4.csv'), 10, -10, 3).should.be.rejected;
        done();
       
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