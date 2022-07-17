/* global describe, before, beforeEach, it, afterEach, after */
const logger = require('../log.js')
const path = require('path')
const testDataPath = require('./config.js').testDataPath
const { importCSV } = require('../import.js')
const chai = require('chai')
chai.should()

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

  describe('Valid csv', () => {
    it('1.txt', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '1.txt'), 10, -10).then(csvDataDict => {
        const data = JSON.parse(csvDataDict)
        data.length.should.equal(16372)
        data[0].temperature.should.equal(6.5)
        data[0].date.should.equal(getTestableDate('2015-09-01 12:00:00'))
        data[16371].temperature.should.equal(7)
        data[16371].date.should.equal(getTestableDate('2015-09-12 21:01:00'))
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      }).catch(error => {
        done(error)
      })
    })
    it('2.txt', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '2.txt'), 10, -10).then((csvDataDict) => {
        const data = JSON.parse(csvDataDict)
        data.length.should.equal(12452)
        data[0].temperature.should.equal(5.5)
        data[0].date.should.equal(getTestableDate('2015-08-27 00:00:00'))
        data[12451].temperature.should.equal(8.5)
        data[12451].date.should.equal(getTestableDate('2015-09-04 16:19:00'))
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      }).catch(error => {
        done(error)
      })
    })
    it('3.txt', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '3.txt'), 10, -10).then((csvDataDict) => {
        const data = JSON.parse(csvDataDict)
        data.length.should.equal(417)
        data[0].temperature.should.equal(3)
        data[0].date.should.equal(getTestableDate('2015-09-22 23:25:00'))
        data[416].temperature.should.equal(2)
        data[416].date.should.equal(getTestableDate('2015-09-23 06:21:00'))
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      }).catch(error => {
        done(error)
      })
    })
    it('5 - renamed headings', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '5.csv'), 10, -25).then((csvDataDict) => {
        importCSV(path.join(testDataPath, '5_renamed_headings.csv'), 10, -25).then((renamedDataDict) => {
          const data = JSON.parse(csvDataDict)
          const renamedData = JSON.parse(renamedDataDict)
          data.length.should.equal(8196)
          data[0].temperature.should.equal(-15.5)
          data[0].date.should.equal(getTestableDate('2016-10-25 18:00'))
          data[8195].temperature.should.equal(-16.5)
          data[8195].date.should.equal(getTestableDate('2016-10-31 10:35'))
          data.length.should.equal(renamedData.length)
          data[0].temperature.should.equal(renamedData[0].temperature)
          data[0].date.should.equal(renamedData[0].date)
          data[20].temperature.should.equal(renamedData[20].temperature)
          data[20].date.should.equal(renamedData[20].date)
          done()
        }, (error) => {
          logger.error('Failed to import csv', error)
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
  describe('Invalid csv', () => {
    it('Not a csv', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '4.xlsx'), 10, -10).should.be.rejected
      done()
    })
    it('No temperature', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '5_no_temperature.csv'), 10, -10).should.be.rejected
      done()
    })
    it('No data', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'no-data.txt'), 10, -10).should.be.rejected
      done()
    })
    it('Invalid dates', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'invalid-dates.txt'), 10, -10).should.be.rejected
      done()
    })
    it('No time', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'no-time.csv'), 10, -10).should.be.rejected
      done()
    })
    it('No data in temperature range', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, 'small.txt'), 100, 90).should.be.rejected
      done()
    })
  })
  /* eslint-enable no-unused-expressions */

  describe('No Humidity', () => {
    it('5_no_humidity.csv', function (done) {
      this.timeout(3000)
      importCSV(path.join(testDataPath, '5_no_humidity.csv'), 10, -25).then((humDataDict) => {
        const data = JSON.parse(humDataDict)
        data.length.should.equal(8196)
        data[0].temperature.should.equal(-15.5)
        data[0].date.should.equal(getTestableDate('2016-10-25 18:00'))
        data[8195].temperature.should.equal(-16.5)
        data[8195].date.should.equal(getTestableDate('2016-10-31 10:35'))
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      }).catch(error => {
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
