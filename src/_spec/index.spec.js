import * as nativeBridge from '..'
import expect from 'expect.js'
import sinon from 'sinon'
import {JSDOM} from 'jsdom'

const PING = 'ping'
const PONG = 'pong'

const SIMULATED_EXEC_TIME = 10
const MOCK_TOPIC = 'MOCK_TOPIC'
const WEBKIT = 'webkit'
const ANDROID = 'android'

const dispatchCustomEvent = (topic, data) => {
  window.dispatchEvent(new window.CustomEvent('nativebridge', {detail: {topic, data}}))
}

// mocked (injected) iOs handler
const postMessage = (args) => {
  expect(args).to.have.keys('topic', 'data')
  const {topic, data} = args
  if (topic === 'string') {
    expect(data).to.be.a('string')
    dispatchCustomEvent(topic, PONG)
  } else if (topic === 'object') {
    expect(data).to.be.an('object')
    dispatchCustomEvent(topic, {test: PONG})
  } else if (topic === 'array') {
    expect(data).to.be.an('array')
    dispatchCustomEvent(topic, [PONG, {test: PONG}])
  } else if (topic === 'N/A') {
    dispatchCustomEvent(topic, {errors: {message: 'fail', errorCode: 123}})
  } else if (topic === MOCK_TOPIC) {
    setTimeout(() => {
      dispatchCustomEvent(topic, {MOCK_TOPIC})
    }, SIMULATED_EXEC_TIME)
  }
}

// mocked (injected) Android handler
const sendMessage = (json) => {
  expect(json).to.be.a('string')
  // use same interface as iOs
  postMessage(JSON.parse(json))
}

const setupSimulator = (simulator) => {
  const mockDom = () => {
    const { window } = new JSDOM(`
    <!doctype html>
      <head></head>
      <body>
        mock document
      </body>
    </html>
    `)

    global.window = window
    global.document = window.document
  }

  const teardownDom = () => {
    // delete global.window // Let window live after timeout used by "nativebridge unit test suite" > validateRpcInput
    delete global.document
  }

  beforeEach(() => {
    mockDom()

    if (simulator === WEBKIT) {
      global.window.webkit = {messageHandlers: {nativebridgeiOS: {postMessage}}}
    } else {
      global.window.NativeBridgeAndroid = {send: sendMessage}
    }

    nativeBridge.setupNativeLink()
  })

  afterEach(() => {
    nativeBridge.destroy()
    teardownDom()
  })
}

describe('on', () => {
  afterEach(() => {
    nativeBridge.destroy()
  })

  it('should attach handler for topic', () => {
    nativeBridge.on('test', () => {})
    expect(nativeBridge.events).to.have.keys(['test'])
  })

  it('should should throw if topic is missing', () => {
    expect(nativeBridge.on).withArgs(null, () => {}).to.throwError()
  })

  it('should should throw if topic has wrong type', () => {
    expect(nativeBridge.on).withArgs({}, () => {}).to.throwError()
  })

  it('should should throw if callback is missing', () => {
    expect(nativeBridge.on).withArgs('test').to.throwError()
  })
})

describe('off', () => {
  afterEach(() => {
    nativeBridge.destroy()
  })

  it('should remove all handlers for topic', () => {
    nativeBridge.on('test', () => {})
    nativeBridge.on('test', () => {})
    nativeBridge.off('test')
    expect(nativeBridge.events['test']).to.be.an('undefined')
  })

  it('should remove specific handler for topic', () => {
    const cb = () => {}
    nativeBridge.on('test', cb)
    nativeBridge.on('test', () => {})
    nativeBridge.off('test', cb)
    expect(nativeBridge.events).to.have.keys(['test'])
    expect(nativeBridge.events['test'].length).equal(1)
  })

  it('should should throw if topic is missing', () => {
    expect(nativeBridge.off).withArgs().to.throwError()
  })

  it('should should throw if topic has wrong type', () => {
    expect(nativeBridge.off).withArgs({}).to.throwError()
  })
})

describe('once', () => {
  afterEach(() => {
    nativeBridge.destroy()
  })

  it('should run handler one time', () => {
    nativeBridge.once('test', () => {})
    nativeBridge.events['test'][0]()
    expect(nativeBridge.events['test']).to.be.an('undefined')
  })

  it('should should throw if topic is missing', () => {
    expect(nativeBridge.once).withArgs().to.throwError()
  })

  it('should should throw if handler is missing', () => {
    expect(nativeBridge.once).withArgs('test').to.throwError()
  })

  it('should should throw if handler has wrong type', () => {
    expect(nativeBridge.once).withArgs('test', {}).to.throwError()
  })

  it('should should throw if topic has wrong type', () => {
    expect(nativeBridge.once).withArgs({}).to.throwError()
  })
})

describe('emit', () => {
  it('should send a message to iOs bridge if present', () => {
    const spy = sinon.spy()
    global.window = {
      webkit: {
        messageHandlers: {
          nativebridgeiOS: {
            postMessage: spy
          }
        }
      }
    }
    nativeBridge.emit('test', {})
    expect(spy.called).to.equal(true)
    // first call, first argument
    expect(spy.args[0][0]).to.eql({topic: 'test', data: {}})
    delete global.window
  })

  it('should send a message to iOs bridge if present', () => {
    const spy = sinon.spy()
    global.window = {
      NativeBridgeAndroid: {
        send: spy
      }
    }
    nativeBridge.emit('test', {})
    expect(spy.called).to.equal(true)
    // first call, first argument
    expect(spy.args[0][0]).to.equal(JSON.stringify({topic: 'test', data: {}}))
    delete global.window
  })

  it('should throw if nativeBridge is not available', () => {
    expect(nativeBridge.emit).withArgs('test', {}).to.throwError()
  })

  it('should throw if topic is missing', () => {
    expect(nativeBridge.emit).withArgs().to.throwError()
  })

  it('should throw if topic has wrong type', () => {
    expect(nativeBridge.emit).withArgs({}).to.throwError()
  })
})

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
        topic: MOCK_TOPIC,
        data: {},
        resolve: (data) => {
          expect(data).to.eql({MOCK_TOPIC})
          done()
        },
        reject: () => {}
      })
    })

    it('should reject when timeout is reached', (done) => {
      nativeBridge.rpc({
        topic: MOCK_TOPIC,
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
        topic: 'N/A',
        data: {},
        resolve: () => {},
        reject: (err) => {
          expect(err).to.be.an(Error)
          done()
        }
      })
    })
  })

  describe('validateRpcInput', () => {
    let topic
    let data
    let resolve
    let reject
    let timeout

    beforeEach(() => {
      topic = 'rpcMethod'
      data = {}
      resolve = () => {}
      reject = () => {}
      timeout = 1000
    })

    it('should not throw if valid input arguments are used', () => {
      expect(nativeBridge.validateRpcInput({topic, data, resolve, reject, timeout})).to.equal(true)
    })

    it('should throw if invalid topic (number) argument is used', () => {
      topic = 123
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid topic (null) argument is used', () => {
      topic = null
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid topic (object) argument is used', () => {
      topic = {}
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid data (string) argument is used', () => {
      data = 'data'
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid data (null) argument is used', () => {
      data = null
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid data (number) argument is used', () => {
      data = 123
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid resolve (number) argument is used', () => {
      resolve = 123
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid resolve (undefined) argument is used', () => {
      resolve = undefined
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid reject (number) argument is used', () => {
      reject = 123
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid reject (undefined) argument is used', () => {
      reject = undefined
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid reject (undefined) argument is used', () => {
      reject = {}
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid timeout (string) argument is used', () => {
      timeout = '123'
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid timeout (null) argument is used', () => {
      timeout = null
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })

    it('should throw if invalid timeout (object) argument is used', () => {
      timeout = {}
      expect(nativeBridge.validateRpcInput).withArgs({topic, data, resolve, reject, timeout}).to.throwError()
    })
  })
})
