/* global describe, before, beforeEach, it, afterEach, after */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const should = require('chai').should()
chai.use(chaiAsPromised)
chai.should()
const { getAverageFromArray } = require('../data.js')

describe('(unit) example suite', () => {
  // Before test suite
  before(function (done) {
    return done()
  })

  // Before each of the tests
  beforeEach(function (done) {
    return done()
  })
  describe('getAverageFromArray', () => {
    it('valid', function (done) {
      const a = [25, 60, 100, 2015, 45]
      getAverageFromArray(a, 10, 2).should.equal((449).toFixed(2))
      done()
    })
    it('invalid', function (done) {
      should.Throw(() => { getAverageFromArray({ invalid: 45 }) }, Error)
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
