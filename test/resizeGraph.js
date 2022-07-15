/* global describe, before, beforeEach, it, afterEach, after */
const logger = require('../log.js')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const should = require('chai').should()
const moment = require('moment')
chai.use(chaiAsPromised)
chai.should()
const path = require('path')
const testDataPath = require('./config.js').testDataPath
const importCSV = require('../import.js').importCSV
const computeData = require('../data.js').computeData

describe('(unit) example suite', () => {
  // Before test suite
  before(function (done) {
    return done()
  })

  // Before each of the tests
  beforeEach(function (done) {
    return done()
  })

  describe('Valid resize', () => {
    it('1.txt', function (done) {
      this.timeout(20000)
      importCSV(path.join(testDataPath, '1.txt'), 10, -10, 3).then((csvDataDict) => {
        csvDataDict.cooling_percentage.should.equal((8.57).toFixed(2))
        csvDataDict.abovePivotPercentage.should.equal((99.85).toFixed(2))
        csvDataDict.belowPivotPercentage.should.equal((0.13).toFixed(2))
        csvDataDict.dewPointAverage.should.equal((4.45).toFixed(2))
        csvDataDict.humidityAverage.should.equal((89.37).toFixed(2))
        csvDataDict.timeCooling.should.equal(84240000)
        csvDataDict.sampleTime.should.equal(982860000)

        const startTime = moment('2015-09-05 03:20:30')
        const endTime = moment('2015-09-10 06:10:30')
        const resizedData = computeData(csvDataDict.dataEntries, 3, startTime, endTime)
        logger.info('resized sample time', resizedData.sampleTime)

        importCSV(path.join(testDataPath, '1-split.txt'), 10, -10, 3).then((preSplitDataDict) => {
          preSplitDataDict.sampleTime.should.equal(resizedData.sampleTime)
          preSplitDataDict.cooling_percentage.should.equal(resizedData.cooling_percentage)
          preSplitDataDict.abovePivotPercentage.should.equal(resizedData.abovePivotPercentage)
          preSplitDataDict.belowPivotPercentage.should.equal(resizedData.belowPivotPercentage)
          preSplitDataDict.dewPointAverage.should.equal(resizedData.dewPointAverage)
          preSplitDataDict.humidityAverage.should.equal(resizedData.humidityAverage)
          preSplitDataDict.timeCooling.should.equal(resizedData.timeCooling)
          preSplitDataDict.sampleTime.should.equal(resizedData.sampleTime)
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

  describe('Valid resize and revert', () => {
    it('1.txt', function (done) {
      this.timeout(20000)
      importCSV(path.join(testDataPath, '1.txt'), 10, -10, 3).then((csvDataDict) => {
        const startTime = moment('2015-09-05 03:20:30')
        const endTime = moment('2015-09-10 06:10:30')
        computeData(csvDataDict.dataEntries, 3, startTime, endTime)
        csvDataDict.start_time = 0
        csvDataDict.end_time = 0
        const fullDataDict = computeData(csvDataDict.dataEntries, 3, 0, 0)
        fullDataDict.sampleTime.should.equal(csvDataDict.sampleTime)
        fullDataDict.cooling_percentage.should.equal(csvDataDict.cooling_percentage)
        fullDataDict.abovePivotPercentage.should.equal(csvDataDict.abovePivotPercentage)
        fullDataDict.belowPivotPercentage.should.equal(csvDataDict.belowPivotPercentage)
        fullDataDict.dewPointAverage.should.equal(csvDataDict.dewPointAverage)
        fullDataDict.humidityAverage.should.equal(csvDataDict.humidityAverage)
        fullDataDict.timeCooling.should.equal(csvDataDict.timeCooling)
        fullDataDict.sampleTime.should.equal(csvDataDict.sampleTime)
        done()
      }, (error) => {
        logger.error('Failed to import csv', error)
        done(error)
      })
    })
  })

  describe('Invalid resize', () => {
    it('1.txt', function (done) {
      should.Throw(() => { computeData([], 3) }, Error)
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
