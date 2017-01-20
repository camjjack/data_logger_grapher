/* global describe, before, beforeEach, it, afterEach, after */
var logger = require('../log.js')
const chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
const path = require('path')
const testDataPath = require('./config.js').testDataPath
const importFile = require('../import.js')
var importCSV = importFile.importCSV

describe('(unit) example suite', () => {
  // Before test suite
  before(function (done) {
    return done()
  })

  // Before each of the tests
  beforeEach(function (done) {
    return done()
  })

  describe('Valid csv', () => {
    it('1.txt', function (done) {
      this.timeout(30000)
      importCSV(path.join(testDataPath, '1.txt'), 10, -10, 3).then((csvDataDict) => {
        csvDataDict.cooling_percentage.should.equal((8.57).toFixed(2))
        csvDataDict.abovePivotPercentage.should.equal((99.85).toFixed(2))
        csvDataDict.belowPivotPercentage.should.equal((0.13).toFixed(2))
        csvDataDict.dewPointAverage.should.equal((4.45).toFixed(2))
        csvDataDict.humidityAverage.should.equal((89.37).toFixed(2))
        csvDataDict.timeCooling.should.equal(84240000)
        csvDataDict.sampleTime.should.equal(982860000)
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
    it('2.txt', function (done) {
      this.timeout(30000)
      importCSV(path.join(testDataPath, '2.txt'), 10, -10, 3).then((csvDataDict) => {
        csvDataDict.cooling_percentage.should.equal((3.89).toFixed(2))
        csvDataDict.abovePivotPercentage.should.equal((100).toFixed(2))
        csvDataDict.belowPivotPercentage.should.equal((0.00).toFixed(2))
        csvDataDict.dewPointAverage.should.equal((3.68).toFixed(2))
        csvDataDict.humidityAverage.should.equal((87.60).toFixed(2))
        csvDataDict.timeCooling.should.equal(29160000)
        csvDataDict.sampleTime.should.equal(749940000)
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
    it('3.txt', function (done) {
      this.timeout(30000)
      importCSV(path.join(testDataPath, '3.txt'), 10, -10, 3).then((csvDataDict) => {
        csvDataDict.cooling_percentage.should.equal((3.37).toFixed(2))
        csvDataDict.abovePivotPercentage.should.equal((0).toFixed(2))
        csvDataDict.belowPivotPercentage.should.equal((94.23).toFixed(2))
        csvDataDict.dewPointAverage.should.equal((-0.37).toFixed(2))
        csvDataDict.humidityAverage.should.equal((80.91).toFixed(2))
        csvDataDict.timeCooling.should.equal(840000)
        csvDataDict.sampleTime.should.equal(24960000)
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
    it('5 - renamed headings', function (done) {
      this.timeout(30000)
      importCSV(path.join(testDataPath, '5.csv'), 10, -10, 3).then((csvDataDict) => {
        importCSV(path.join(testDataPath, '5_renamed_headings.csv'), 10, -10, 3).then((renamedDataDict) => {
          csvDataDict.cooling_percentage.should.equal(renamedDataDict.cooling_percentage)
          csvDataDict.abovePivotPercentage.should.equal(renamedDataDict.abovePivotPercentage)
          csvDataDict.belowPivotPercentage.should.equal(renamedDataDict.belowPivotPercentage)
          csvDataDict.dewPointAverage.should.equal(renamedDataDict.dewPointAverage)
          csvDataDict.timeCooling.should.equal(renamedDataDict.timeCooling)
          csvDataDict.sampleTime.should.equal(renamedDataDict.sampleTime)
          done()
        }, (error) => {
          logger.error('Failed to import csv', error)
          done(error)
        })
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
  })

  describe('Invalid csv', () => {
    it('Not a csv', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '4.xlsx'), 10, -10, 3).should.be.rejected
      done()
    })
    it('No temperature', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '5_no_temperature.csv'), 10, -10, 3).should.be.rejected
      done()
    })
    it('No data', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'no-data.txt'), 10, -10, 3).should.be.rejected
      done()
    })
    it('Invalid dates', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'invalid-dates.txt'), 10, -10, 3).should.be.rejected
      done()
    })
    it('No time', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'no-time.csv'), 10, -10, 3).should.be.rejected
      done()
    })
    it('No data in temperature range', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'small.txt'), 100, 90, 3).should.be.rejected
      done()
    })
  })

  describe('No Humidity', () => {
    it('5_no_humidity.csv', function (done) {
      this.timeout(30000)
      importCSV(path.join(testDataPath, '5_no_humidity.csv'), 10, -25, -15).then((humDataDict) => {
        humDataDict.cooling_percentage.should.equal((8.86).toFixed(2))
        humDataDict.abovePivotPercentage.should.equal((22.23).toFixed(2))
        humDataDict.belowPivotPercentage.should.equal((70.76).toFixed(2))
        humDataDict.dewPointAverage.should.be.NaN
        humDataDict.humidityAverage.should.be.NaN
        humDataDict.timeCooling.should.equal(43560000)
        humDataDict.sampleTime.should.equal(491700000)
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
  })

  // After each of the tests
  afterEach(function (done) {
    done()
  })

  // At the end of all
  after(function (done) {
    done()
  })
})
