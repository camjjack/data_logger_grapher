/* global describe, before, beforeEach, it, afterEach, after */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.should()
chai.use(chaiAsPromised)
chai.should()
const { matchInStringArray, fromOADate, parseDate } = require('../utils.js')

describe('(unit) example suite', () => {
  // Before test suite
  before(function (done) {
    return done()
  })

  // Before each of the tests
  beforeEach(function (done) {
    return done()
  })

  describe('parse valid date', () => {
    it('DD/MM/YYYY HH:mm', function (done) {
      const a = parseDate('01/02/2014 21:15')
      a.toString().should.equal((new Date(2014, 1, 1, 21, 15)).toString())
      done()
    })
    it('DD/MM/YYYY H:mm', function (done) {
      const a = parseDate('03/12/2017 2:54')
      a.toString().should.equal((new Date(2017, 11, 3, 2, 54)).toString())
      done()
    })
    it('YYYY-MM-DD HH:mm:ss', function (done) {
      const a = parseDate('2011-05-08 11:02:45')
      a.toString().should.equal((new Date(2011, 4, 8, 11, 2, 45)).toString())
      done()
    })
  })

  describe('fomat invalid date', () => {
    it('0122/2014 21:15', function (done) {
      const a = parseDate('0122/2014 21:15')
      a.toString().should.equal('Invalid Date')
      done()
    })
  })

  describe('matchInStringArray', () => {
    it('valid case insensitive', function (done) {
      const a = ['green', 'red', 'blue']
      matchInStringArray('Red', a, false).should.equal(true)
      done()
    })
    it('valid case sensitive', function (done) {
      const a = ['green', 'red', 'blue']
      matchInStringArray('red', a, true).should.equal(true)
      done()
    })
    it('valid case sensitive by default', function (done) {
      const a = ['green', 'red', 'blue']
      matchInStringArray('blue', a).should.equal(true)
      done()
    })
    it('invalid case insensitive', function (done) {
      const a = ['green', 'red', 'blue']
      matchInStringArray('brown', a, false).should.equal(false)
      done()
    })
    it('valid case sensitive', function (done) {
      const a = ['green', 'red', 'blue']
      matchInStringArray('Red', a, true).should.equal(false)
      done()
    })
  })

  describe('fromOADate tests', () => {
    it('valid prior 1900', function (done) {
      fromOADate(-3412.154).toString().should.equal(new Date(1890, 7, 26, 20, 19, 6).toString())
      done()
    })
    it('invalid parameter', function (done) {
      fromOADate('1900/12/11 05:12').toString().should.equal('Invalid Date')
      done()
    })
    it('invalid date', function (done) {
      fromOADate(-4654654898).toString().should.equal('Invalid Date')
      done()
    })
    it('valid pre 1900', function (done) {
      fromOADate(42456.125).toString().should.equal((new Date(2016, 2, 27, 3).toString()))
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
