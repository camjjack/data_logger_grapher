/* global describe, before, beforeEach, it, afterEach, after */
const logger = require('../log.js')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
const path = require('path')
const { importCSV, importExcel } = require('../import.js')
const testDataPath = require('./config.js').testDataPath

const getTestableDate = (dateStr) => {
  return JSON.parse(JSON.stringify(new Date(dateStr)))
}

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
      importExcel(path.join(testDataPath, '4.xlsx'), 10, -25).then((xlsxDict) => {
        const data = JSON.parse(xlsxDict)
        data.length.should.equal(8200)
        data[0].temperature.should.equal(-15)
        data[0].date.should.equal(getTestableDate('2016-11-07 12:00'))
        data[8199].temperature.should.equal(-16.5)
        data[8199].date.should.equal(getTestableDate('2016-11-13 04:39:00'))
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      }).catch(error => {
        done(error)
      })
    })
    it('6.xlsx', function (done) {
      this.timeout(30000)
      importExcel(path.join(testDataPath, '6.xlsx'), 10, -10, 3).then((xlsxDict) => {
        const data = JSON.parse(xlsxDict)
        data.length.should.equal(10070)
        data[0].temperature.should.equal(4)
        data[0].date.should.equal(getTestableDate('2015-09-22 12:00'))
        data[10069].temperature.should.equal(3.5)
        data[10069].date.should.equal(getTestableDate('2015-09-29 11:49:00'))
        // xlsxDict.cooling_percentage.should.equal((3.94).toFixed(2))
        // xlsxDict.abovePivotPercentage.should.equal((26.38).toFixed(2))
        // xlsxDict.belowPivotPercentage.should.equal((45.78).toFixed(2))
        // xlsxDict.dewPointAverage.should.equal((0.07).toFixed(2))
        // xlsxDict.humidityAverage.should.equal((81.74).toFixed(2))
        // xlsxDict.timeCooling.should.equal(23820000)
        // xlsxDict.sampleTime.should.equal(604140000)
        done()
      }, (error) => {
        logger.error('Failed to import xlsx', error)
        done(error)
      }).catch(error => {
        done(error)
      })
    })
  })

  describe('Comparisons', () => {
    it('4 csv vs xlsx', function (done) {
      this.timeout(30000)
      importExcel(path.join(testDataPath, '4.xlsx'), 10, -25).then((xlsxDict) => {
        importCSV(path.join(testDataPath, '4.csv'), 10, -25).then((csvDataDict) => {
          const cvsData = JSON.parse(csvDataDict)
          const xlsxData = JSON.parse(xlsxDict)
          for (let i = 0; i < cvsData.length; i++) {
            cvsData[i].date.should.equal(xlsxData[i].date)
          }
          done()
        }, (error) => {
          logger.error('Failed to import xlsx', error)
          done(error)
        }).catch(error => {
          done(error)
        })
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      }).catch(error => {
        done(error)
      })
    })
  })

  /* eslint-disable no-unused-expressions */
  describe('Invalid  xlsx', () => {
    it('should pass', function (done) {
      importExcel(path.join(testDataPath, '4.csv'), 10, -10).should.be.rejected
      done()
    })
  })

  describe('Invalid  headings', () => {
    it('should pass', function (done) {
      importExcel(path.join(testDataPath, '4-no-temperature-heading.xlsx'), 10, -10).should.be.rejected
      done()
    })
  })
  /* eslint-enable no-unused-expressions */

  // After each of the tests
  afterEach(function (done) {
    done()
  })

  // At the end of all
  after(function (done) {
    done()
  })
})
