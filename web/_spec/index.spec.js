import * as nativeBridge from '..'
import expect from 'expect.js'
import sinon from 'sinon'
import {JSDOM} from 'jsdom'

const PING = 'ping'
const PONG = 'pong'

const SIMULATED_EXEC_TIME = 10
const MOCK_TYPE = 'MOCK_TYPE'
const WEBKIT = 'webkit'
const ANDROID = 'android'

const getMockDOM = () => new JSDOM(`
<!doctype html>
  <head></head>
  <body>
    mock document
  </body>
</html>
`)

const dispatchCustomEvent = (type, data) => {
  window.dispatchEvent(new window.CustomEvent('nativebridge', {detail: {type, data}}))
}

// mocked (injected) iOs handler
const postMessage = (args) => {
  expect(args).to.have.keys('type', 'data')
  const {type, data} = args
  if (type === 'string') {
    expect(data).to.be.a('string')
    dispatchCustomEvent(type, PONG)
  } else if (type === 'object') {
    expect(data).to.be.an('object')
    dispatchCustomEvent(type, {test: PONG})
  } else if (type === 'array') {
    expect(data).to.be.an('array')
    dispatchCustomEvent(type, [PONG, {test: PONG}])
  } else if (type === 'N/A') {
    dispatchCustomEvent(type, {errors: {message: 'fail', errorCode: 123}})
  } else if (type === MOCK_TYPE) {
    setTimeout(() => {
      dispatchCustomEvent(type, {MOCK_TYPE})
    }, SIMULATED_EXEC_TIME)
  }
}

// mocked (injected) Android handler
const sendMessage = (json) => {
  expect(json).to.be.a('string')
  // use same interface as iOs
  postMessage(JSON.parse(json))
}

const mockDom = () => {
  const {window} = getMockDOM()
  global.window = window
  global.document = window.document
  nativeBridge.setupNativeLink()
}

const teardownDom = () => {
  nativeBridge.destroy()
  delete global.window
  delete global.document
}

const setupSimulator = (simulator) => {
  beforeEach(() => {
    mockDom()
    if (simulator === WEBKIT) {
      global.window.webkit = {messageHandlers: {nativebridgeiOS: {postMessage}}}
    } else {
      global.window.NativeBridgeAndroid = {send: sendMessage}
    }
  })

  afterEach(() => {
    teardownDom()
  })
}

const testSuite = (simulator) => {
  describe(`testSuite ${simulator}`, () => {
    setupSimulator(simulator)

    it(`should be able to ping/pong a string from (simulated) ${simulator} interface`, () => {
      const spy = sinon.spy()
      nativeBridge.on('string', spy)
      nativeBridge.emit('string', PING)
      expect(spy.called).to.equal(true)
      expect(spy.calledWith(PONG)).to.equal(true)
      nativeBridge.off('string', spy)
    })

    it(`should be able to ping/pong an object from (simulated) ${simulator} interface`, () => {
      const spy = sinon.spy()
      nativeBridge.on('object', spy)
      nativeBridge.emit('object', {test: PING})
      expect(spy.called).to.equal(true)
      expect(spy.calledWith({test: PONG})).to.equal(true)
      nativeBridge.off('object', spy)
    })

    it(`should be able to ping/pong an array from (simulated) ${simulator} interface`, () => {
      const spy = sinon.spy()
      nativeBridge.on('array', spy)
      nativeBridge.emit('array', [PING, {test: PING}])
      expect(spy.called).to.equal(true)
      expect(spy.calledWith([PONG, {test: PONG}])).to.equal(true)
      nativeBridge.off('array', spy)
    })

    it('should trigger multiple subscribers listening on the same topic', () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      nativeBridge.on('string', spy1)
      nativeBridge.on('string', spy2)
      nativeBridge.emit('string', PING)
      expect(spy1.called).to.equal(true)
      expect(spy2.called).to.equal(true)
      expect(spy1.calledWith(PONG)).to.equal(true)
      expect(spy2.calledWith(PONG)).to.equal(true)
      nativeBridge.off('string', spy1)
      nativeBridge.off('string', spy2)
    })

    it('should unsubscribe when using off with handler as arg', () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      nativeBridge.on('string', spy1)
      nativeBridge.on('string', spy2)
      nativeBridge.off('string', spy2)
      nativeBridge.emit('string', PING)
      expect(spy1.called).to.equal(true)
      expect(spy2.called).to.equal(false)
      expect(spy1.calledWith(PONG)).to.equal(true)
      nativeBridge.off('string', spy1)
    })

    it('should unsubscribe when using off', () => {
      const spy1 = sinon.spy()
      const spy2 = sinon.spy()
      nativeBridge.on('string', spy1)
      nativeBridge.on('string', spy2)
      nativeBridge.off('string')
      nativeBridge.emit('string', PING)
      expect(spy1.called).to.equal(false)
      expect(spy2.called).to.equal(false)
    })

    it('should unsubscribe automatically after first emit, when using once', () => {
      const spy = sinon.spy()
      nativeBridge.once('string', spy)
      nativeBridge.emit('string', PING)
      nativeBridge.emit('string', PING)
      expect(spy.callCount).to.equal(1)
    })
  })
}

describe('nativebridge unit test suite', () => {
  testSuite(WEBKIT)

  testSuite(ANDROID)

  describe('rpc', () => {
    setupSimulator(WEBKIT)

    it('should respond using simulated native', (done) => {
      nativeBridge.rpc({
        type: MOCK_TYPE,
        data: {},
        resolve: (data) => {
          expect(data).to.eql({MOCK_TYPE})
          done()
        },
        reject: () => {}
      })
    })

    it('should reject when timeout is reached', (done) => {
      nativeBridge.rpc({
        type: MOCK_TYPE,
        data: {},
        resolve: () => {},
        reject: (err) => {
          expect(err).to.be.an(Error)
          done()
        },
        timeout: 0
      })
    })

    it('should reject when an error-type is returned', (done) => {
      nativeBridge.rpc({
        type: 'N/A',
        data: {},
        resolve: () => {},
        reject: (err) => {
          expect(err).to.be.an(Error)
          done()
        }
      })
    })
  })

  describe('validateInput', () => {
    let type
    let data
    let resolve
    let reject
    let timeout

    beforeEach(() => {
      type = 'rpcMethod'
      data = {}
      resolve = () => {}
      reject = () => {}
      timeout = 1000
    })

    it('should not throw if valid input arguments are used', () => {
      expect(nativeBridge.validateInput({type, data, resolve, reject, timeout})).to.equal(true)
    })

    it('should throw if invalid type (number) argument is used', () => {
      type = 123
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid type (null) argument is used', () => {
      type = null
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid type (object) argument is used', () => {
      type = {}
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid data (string) argument is used', () => {
      data = 'data'
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid data (null) argument is used', () => {
      data = null
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid data (number) argument is used', () => {
      data = 123
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid resolve (number) argument is used', () => {
      resolve = 123
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid resolve (undefined) argument is used', () => {
      resolve = undefined
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid reject (number) argument is used', () => {
      reject = 123
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid reject (undefined) argument is used', () => {
      reject = undefined
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid reject (undefined) argument is used', () => {
      reject = {}
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid timeout (string) argument is used', () => {
      timeout = '123'
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid timeout (null) argument is used', () => {
      timeout = null
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid timeout (object) argument is used', () => {
      timeout = {}
      expect(nativeBridge.validateInput).withArgs({type, data, resolve, reject, timeout}).to.throwError()
    })
  })
})
