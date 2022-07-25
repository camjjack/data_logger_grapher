/* global describe, before, beforeEach, it, afterEach, after */
const logger = require('../log.js')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const should = require('chai').should()
chai.use(chaiAsPromised)
chai.should()
const path = require('path')
const testDataPath = require('./config.js').testDataPath
const importCSV = require('../import.js').importCSV
const { computeData } = require('../data.js')

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
      importCSV(path.join(testDataPath, '1.txt'), 10, -10).then((csvDataDict) => {
        const data = computeData(JSON.parse(csvDataDict), 3)
        data.cooling_percentage.should.equal((8.57).toFixed(2))
        data.abovePivotPercentage.should.equal((99.85).toFixed(2))
        data.belowPivotPercentage.should.equal((0.13).toFixed(2))
        data.dewPointAverage.should.equal((4.45).toFixed(2))
        data.humidityAverage.should.equal((89.37).toFixed(2))
        data.timeCooling.should.equal(84240000)
        data.sampleTime.should.equal(982860000)

        const startTime = new Date('2015-09-05 03:20:30')
        const endTime = new Date('2015-09-10 06:10:30')
        const resizedData = computeData(JSON.parse(csvDataDict), 3, false, startTime, endTime)

        logger.info('resized sample time', resizedData.sampleTime)

        importCSV(path.join(testDataPath, '1-split.txt'), 10, -10).then((preSplitDataDict) => {
          const preSplitData = computeData(JSON.parse(preSplitDataDict), 3)
          preSplitData.sampleTime.should.equal(resizedData.sampleTime)
          preSplitData.cooling_percentage.should.equal(resizedData.cooling_percentage)
          preSplitData.abovePivotPercentage.should.equal(resizedData.abovePivotPercentage)
          preSplitData.belowPivotPercentage.should.equal(resizedData.belowPivotPercentage)
          preSplitData.dewPointAverage.should.equal(resizedData.dewPointAverage)
          preSplitData.humidityAverage.should.equal(resizedData.humidityAverage)
          preSplitData.timeCooling.should.equal(resizedData.timeCooling)
          preSplitData.sampleTime.should.equal(resizedData.sampleTime)
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
