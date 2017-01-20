/* global describe, before, beforeEach, it, afterEach, after */
var logger = require('../log.js')
const chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
const path = require('path')
const importFile = require('../import.js')
const testDataPath = require('./config.js').testDataPath
var importCSV = importFile.importCSV
var importExcel = importFile.importExcel

describe('(unit) example suite', () => {
  // Before test suite
  before(function (done) {
    return done()
  })

  // Before each of the tests
  beforeEach(function (done) {
    return done()
  })

  describe('Valid xlsx', () => {
    it('4.xlsx', function (done) {
      this.timeout(30000)
      importExcel(path.join(testDataPath, '4.xlsx'), 10, -25, -15).then((xlsxDict) => {
        xlsxDict.cooling_percentage.should.equal((3.89).toFixed(2))
        xlsxDict.abovePivotPercentage.should.equal((21.51).toFixed(2))
        xlsxDict.belowPivotPercentage.should.equal((72.52).toFixed(2))
        xlsxDict.dewPointAverage.isNan
        xlsxDict.humidityAverage.should.equal((71.04).toFixed(2))
        xlsxDict.timeCooling.should.equal(19140000)
        xlsxDict.sampleTime.should.equal(491940000)
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
    it('6.xlsx', function (done) {
      this.timeout(30000)
      importExcel(path.join(testDataPath, '6.xlsx'), 10, -10, 3).then((xlsxDict) => {
        xlsxDict.cooling_percentage.should.equal((3.94).toFixed(2))
        xlsxDict.abovePivotPercentage.should.equal((26.38).toFixed(2))
        xlsxDict.belowPivotPercentage.should.equal((45.78).toFixed(2))
        xlsxDict.dewPointAverage.should.equal((0.07).toFixed(2))
        xlsxDict.humidityAverage.should.equal((81.74).toFixed(2))
        xlsxDict.timeCooling.should.equal(23820000)
        xlsxDict.sampleTime.should.equal(604140000)
        done()
      }, (error) => {
        logger.error('Failed to import xlsx', error)
        done(error)
      })
    })
  })

  describe('Comparisons', () => {
    it('4 csv vs xlsx', function (done) {
      this.timeout(30000)
      importExcel(path.join(testDataPath, '4.xlsx'), 10, -25, 3).then((xlsxDict) => {
        importCSV(path.join(testDataPath, '4.csv'), 10, -25, 3).then((csvDataDict) => {
          for (let i = 0; i < csvDataDict.dataEntries.length; i++) {
            csvDataDict.dataEntries[i].date.format().should.equal(xlsxDict.dataEntries[i].date.format())
          }
          csvDataDict.cooling_percentage.should.equal(xlsxDict.cooling_percentage)
          csvDataDict.abovePivotPercentage.should.equal(xlsxDict.abovePivotPercentage)
          csvDataDict.belowPivotPercentage.should.equal(xlsxDict.belowPivotPercentage)
          csvDataDict.humidityAverage.should.equal(xlsxDict.humidityAverage)
          csvDataDict.timeCooling.should.equal(xlsxDict.timeCooling)
          csvDataDict.sampleTime.should.equal(xlsxDict.sampleTime)
          done()
        }, (error) => {
          logger.error('Failed to import xlsx', error)
          done(error)
        })
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
  })

  describe('Invalid  xlsx', () => {
    it('should pass', function (done) {
      importExcel(path.join(testDataPath, '4.csv'), 10, -10, 3).should.be.rejected
      done()
    })
  })

  describe('Invalid  headings', () => {
    it('should pass', function (done) {
      importExcel(path.join(testDataPath, '4-no-temperature-heading.xlsx'), 10, -10, 3).should.be.rejected
      done()
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
