/* global describe, before, beforeEach, it, afterEach, after */
const chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var should = require('chai').should()
var moment = require('moment')
chai.use(chaiAsPromised)
chai.should()
var {formatDate, getAverageFromArray, matchInStringArray, fromOADate} = require('../utils.js')

describe('(unit) example suite', () => {
  // Before test suite
  before(function (done) {
    return done()
  })

  // Before each of the tests
  beforeEach(function (done) {
    return done()
  })

  describe('fomat valid date', () => {
    it('DD/MM/YYYY HH:mm', function (done) {
      let a = formatDate('01/02/2014 21:15')
      a.format().should.equal(moment({year: 2014, month: 1, day: 1, hour: 21, minute: 15}).format())
      done()
    })
    it('DD/MM/YYYY H:mm', function (done) {
      let a = formatDate('03/12/2017 2:54')
      a.format().should.equal(moment({year: 2017, month: 11, day: 3, hour: 2, minute: 54}).format())
      done()
    })
    it('YYYY-MM-DD HH:mm:ss', function (done) {
      let a = formatDate('2011-05-08 11:02:45')
      a.format().should.equal(moment({year: 2011, month: 4, day: 8, hour: 11, minute: 2, seconds: 45}).format())
      done()
    })
  })

  describe('fomat invalid date', () => {
    it('0122/2014 21:15', function (done) {
      let a = formatDate('0122/2014 21:15')
      a.format().should.equal('Invalid date')
      done()
    })
  })

  describe('getAverageFromArray', () => {
    it('valid', function (done) {
      let a = [25, 60, 100, 2015, 45]
      getAverageFromArray(a, 10, 2).should.equal((449).toFixed(2))
      done()
    })
    it('invalid', function (done) {
      should.Throw(() => { getAverageFromArray({invalid: 45}) }, Error)
      done()
    })
  })

  describe('matchInStringArray', () => {
    it('valid case insensitive', function (done) {
      let a = ['green', 'red', 'blue']
      matchInStringArray('Red', a, false).should.be.true
      done()
    })
    it('valid case sensitive', function (done) {
      let a = ['green', 'red', 'blue']
      matchInStringArray('red', a, true).should.be.true
      done()
    })
    it('valid case sensitive by default', function (done) {
      let a = ['green', 'red', 'blue']
      matchInStringArray('blue', a).should.be.true
      done()
    })
    it('invalid case insensitive', function (done) {
      let a = ['green', 'red', 'blue']
      matchInStringArray('brown', a, false).should.be.false
      done()
    })
    it('valid case sensitive', function (done) {
      let a = ['green', 'red', 'blue']
      matchInStringArray('Red', a, true).should.be.false
      done()
    })
  })

  describe('fromOADate', () => {
    it('valid post 1900', function (done) {
      fromOADate(-3412.154).format().should.equal(moment({year: 1890, month: 7, day: 26, hour: 20, minute: 18, seconds: 14}).format())
      done()
    })
    it('invalid parameter', function (done) {
      fromOADate('1900/12/11 05:12').format().should.equal('Invalid date')
      done()
    })
    it('invalid date', function (done) {
      fromOADate(-4654654898).format().should.equal('Invalid date')
      done()
    })
    it('valid pre 1900', function (done) {
      fromOADate(42456.125).format().should.equal(moment({year: 2016, month: 2, day: 27, hour: 3}).format())
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
