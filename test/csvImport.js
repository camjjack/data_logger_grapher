'use strict'

const chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
const path = require('path')
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
    it('should pass', function(done) {
        this.timeout(30000);
        importCSV(path.resolve(__dirname, 'data', '1.txt'), 10, -10, 3).then(function(csv_data_dict) {
            csv_data_dict.cooling_percentage.should.equal((8.57).toFixed(2));
            csv_data_dict.above_pivot_percentage.should.equal((99.85).toFixed(2));
            csv_data_dict.below_pivot_percentage.should.equal((0.13).toFixed(2));
            csv_data_dict.dew_point_average.should.equal((4.45).toFixed(2));
            csv_data_dict.humidity_average.should.equal((89.37).toFixed(2));
            csv_data_dict.cooling.should.equal(84240000);
            csv_data_dict.sampleTime.should.equal(982860000);
            done();
            
       }, function(error) {
           console.error("Failed to import csv", error);
            done(error);
       });
       
    });

  // add other tests...
  });

  // add other features...

  // After each of the tests
  afterEach((done) => {
    done()
  })

  // At the end of all
  after((done) => {
    done()
  })
})