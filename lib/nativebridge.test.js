/* globals describe, expect, it, jest, beforeEach, afterEach */
const nativeBridge = require('./nativebridge.min.js')

const PING = 'ping'
const PONG = 'pong'

const SIMULATED_EXEC_TIME = 10
const MOCK_TOPIC = 'MOCK_TOPIC'
const ANDROID = 'android'
const WEBKIT = 'webkit'

const dispatchCustomEvent = (topic, data) => {
  window.dispatchEvent(new window.CustomEvent('nativebridge', { detail: { topic, data } }))
}

// mocked (injected) iOs handler
const postMessage = ({ topic, data }) => {
  expect(topic).toBeDefined()
  expect(data).toBeDefined()

  if (topic === 'string') {
    expect(typeof data).toBe('string')
    dispatchCustomEvent(topic, PONG)
  } else if (topic === 'object') {
    expect(typeof data).toBe('object')
    dispatchCustomEvent(topic, { test: PONG })
  } else if (topic === 'array') {
    expect(data).toBeInstanceOf(Array)
    dispatchCustomEvent(topic, [PONG, { test: PONG }])
  } else if (topic === 'N/A') {
    dispatchCustomEvent(topic, { errors: { message: 'fail', errorCode: 123 } })
  } else if (topic === MOCK_TOPIC) {
    setTimeout(() => {
      dispatchCustomEvent(topic, { MOCK_TOPIC })
    }, SIMULATED_EXEC_TIME)
  }
}

// mocked (injected) Android handler
const sendMessage = (json) => {
  expect(typeof json).toBe('string')
  // use same interface as iOs
  postMessage(JSON.parse(json))
}

const setupSimulator = (simulator) => {
  beforeEach(() => {
    if (simulator === WEBKIT) {
      window.webkit = { messageHandlers: { nativebridgeiOS: { postMessage } } }
    } else {
      window.NativeBridgeAndroid = { send: sendMessage }
    }

    nativeBridge.setupNativeLink()
  })

  afterEach(() => nativeBridge.destroy())
}

describe('on', () => {
  afterEach(() => nativeBridge.destroy())

  it('should attach handler for topic', () => {
    nativeBridge.on('test', () => {})
    expect(nativeBridge.events).toHaveProperty('test')
  })

  it('should should throw if topic is missing', () => {
    expect(() => nativeBridge.on(null, () => {})).toThrow()
  })

  it('should should throw if topic has wrong type', () => {
    expect(() => nativeBridge.on({}, () => {})).toThrow()
  })

  it('should should throw if callback is missing', () => {
    expect(() => nativeBridge.on('test')).toThrow()
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
    expect(nativeBridge.events.test).toHaveLength(0)
  })

  it('should remove specific handler for topic', () => {
    const cb = () => {}
    nativeBridge.on('test', cb)
    nativeBridge.on('test', () => {})
    nativeBridge.off('test', cb)
    expect(nativeBridge.events).toHaveProperty('test')
    expect(nativeBridge.events.test).toHaveLength(1)
  })

  it('should should throw if topic is missing', () => {
    expect(() => nativeBridge.off()).toThrow()
  })

  it('should should throw if topic has wrong type', () => {
    expect(() => nativeBridge.off({})).toThrow()
  })
})

describe('once', () => {
  afterEach(() => {
    nativeBridge.destroy()
  })

  it('should run handler one time', () => {
    nativeBridge.once('test', () => {})
    nativeBridge.events.test[0]()
    expect(nativeBridge.events.test).toHaveLength(0)
  })

  it('should should throw if topic is missing', () => {
    expect(() => nativeBridge.once()).toThrow()
  })

  it('should should throw if handler is missing', () => {
    expect(() => nativeBridge.once('test')).toThrow()
  })

  it('should should throw if handler has wrong type', () => {
    expect(() => nativeBridge.once('test', {})).toThrow()
  })

  it('should should throw if topic has wrong type', () => {
    expect(() => nativeBridge.once({})).toThrow()
  })
})

describe('emit', () => {
  it('should send a message to iOs bridge if present', () => {
    const postMessage = jest.fn()
    window.webkit = { messageHandlers: { nativebridgeiOS: { postMessage } } }

    nativeBridge.emit('test', {})
    expect(postMessage).toHaveBeenCalledWith({ topic: 'test', data: {} })
    window.webkit = null // Reset
  })

  it('should send a message to iOs bridge if present', () => {
    const send = jest.fn()
    window.NativeBridgeAndroid = { send }
    nativeBridge.emit('test', {})
    expect(send).toHaveBeenCalledWith(JSON.stringify({ topic: 'test', data: {} }))
    window.NativeBridgeAndroid = null // Reset
  })

  it('should throw if nativeBridge is not available', () => {
    expect(() => nativeBridge.emit('test', {})).toThrow()
  })

  it('should throw if topic is missing', () => {
    expect(() => nativeBridge.emit()).toThrow()
  })

  it('should throw if topic has wrong type', () => {
    expect(() => nativeBridge.emit({})).toThrow()
  })
})

const testSuite = (simulator) => {
  describe(`testSuite ${simulator}`, () => {
    setupSimulator(simulator)

    it(`should be able to ping/pong a string from (simulated) ${simulator} interface`, () => {
      const spy = jest.fn()
      nativeBridge.on('string', spy)
      nativeBridge.emit('string', PING)
      expect(spy).toHaveBeenCalledWith(PONG)
      nativeBridge.off('string', spy)
    })

    it(`should be able to ping/pong an object from (simulated) ${simulator} interface`, () => {
      const spy = jest.fn()
      nativeBridge.on('object', spy)
      nativeBridge.emit('object', { test: PING })
      expect(spy).toHaveBeenCalledWith({ test: PONG })
      nativeBridge.off('object', spy)
    })

    it(`should be able to ping/pong an array from (simulated) ${simulator} interface`, () => {
      const spy = jest.fn()
      nativeBridge.on('array', spy)
      nativeBridge.emit('array', [PING, { test: PING }])
      expect(spy).toHaveBeenCalledWith([PONG, { test: PONG }])
      nativeBridge.off('array', spy)
    })

    it('should trigger multiple subscribers listening on the same topic', () => {
      const spy1 = jest.fn()
      const spy2 = jest.fn()
      nativeBridge.on('string', spy1)
      nativeBridge.on('string', spy2)
      nativeBridge.emit('string', PING)
      expect(spy1).toHaveBeenCalled()
      expect(spy2).toHaveBeenCalled()
      expect(spy1).toHaveBeenCalledWith(PONG)
      expect(spy2).toHaveBeenCalledWith(PONG)
      nativeBridge.off('string', spy1)
      nativeBridge.off('string', spy2)
    })

    it('should unsubscribe when using off with handler as arg', () => {
      const spy1 = jest.fn()
      const spy2 = jest.fn()
      nativeBridge.on('string', spy1)
      nativeBridge.on('string', spy2)
      nativeBridge.off('string', spy2)
      nativeBridge.emit('string', PING)
      expect(spy1).toHaveBeenCalled()
      expect(spy2).not.toHaveBeenCalled()
      expect(spy1).toHaveBeenCalledWith(PONG)
      nativeBridge.off('string', spy1)
    })

    it('should unsubscribe when using off', () => {
      const spy1 = jest.fn()
      const spy2 = jest.fn()
      nativeBridge.on('string', spy1)
      nativeBridge.on('string', spy2)
      nativeBridge.off('string')
      nativeBridge.emit('string', PING)
      expect(spy1).not.toHaveBeenCalled()
      expect(spy2).not.toHaveBeenCalled()
    })

    it('should unsubscribe automatically after first emit, when using once', () => {
      const spy = jest.fn()
      nativeBridge.once('string', spy)
      nativeBridge.emit('string', PING)
      nativeBridge.emit('string', PING)
      expect(spy).toHaveBeenCalledTimes(1)
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
          expect(data).toMatchObject({ MOCK_TOPIC })
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
          expect(err).toBeInstanceOf(Error)
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
          expect(err).toBeInstanceOf(Error)
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
      expect(nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toBeTruthy()
    })

    it('should throw if invalid topic (number) argument is used', () => {
      topic = 123
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid topic (null) argument is used', () => {
      topic = null
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid topic (object) argument is used', () => {
      topic = {}
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid data (string) argument is used', () => {
      data = 'data'
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid data (null) argument is used', () => {
      data = null
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid data (number) argument is used', () => {
      data = 123
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid resolve (number) argument is used', () => {
      resolve = 123
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid resolve (undefined) argument is used', () => {
      resolve = undefined
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid reject (number) argument is used', () => {
      reject = 123
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid reject (undefined) argument is used', () => {
      reject = undefined
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid reject (undefined) argument is used', () => {
      reject = {}
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid timeout (string) argument is used', () => {
      timeout = '123'
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid timeout (null) argument is used', () => {
      timeout = null
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })

    it('should throw if invalid timeout (object) argument is used', () => {
      timeout = {}
      expect(() => nativeBridge.validateRpcInput({ topic, data, resolve, reject, timeout })).toThrow()
    })
  })
})
