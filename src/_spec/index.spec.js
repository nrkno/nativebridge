const {on, off, emit, setupNativeLink, destroy} = require('..')
const expect = require('expect.js')
const sinon = require('sinon')
const {JSDOM} = require('jsdom')

const PING = 'ping'
const PONG = 'pong'

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
  }
}

// mocked (injected) Android handler
const sendMessage = (json) => {
  expect(json).to.be.a('string')
  // use same interface as iOs
  postMessage(JSON.parse(json))
}

const testSuite = (nativeType) => {
  it(`should be able to ping/pong a string from (simulated) ${nativeType} interface`, () => {
    const spy = sinon.spy()
    on('string', spy)
    emit('string', PING)
    expect(spy.called).to.equal(true)
    expect(spy.calledWith(PONG)).to.equal(true)
    off('string', spy)
  })

  it(`should be able to ping/pong an object from (simulated) ${nativeType} interface`, () => {
    const spy = sinon.spy()
    on('object', spy)
    emit('object', {test: PING})
    expect(spy.called).to.equal(true)
    expect(spy.calledWith({test: PONG})).to.equal(true)
    off('object', spy)
  })

  it(`should be able to ping/pong an array from (simulated) ${nativeType} interface`, () => {
    const spy = sinon.spy()
    on('array', spy)
    emit('array', [PING, {test: PING}])
    expect(spy.called).to.equal(true)
    expect(spy.calledWith([PONG, {test: PONG}])).to.equal(true)
    off('array', spy)
  })

  it('should trigger multiple subscribers listening on the same topic', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    on('string', spy1)
    on('string', spy2)
    emit('string', PING)
    expect(spy1.called).to.equal(true)
    expect(spy2.called).to.equal(true)
    expect(spy1.calledWith(PONG)).to.equal(true)
    expect(spy2.calledWith(PONG)).to.equal(true)
    off('string', spy1)
    off('string', spy2)
  })

  it('should unsubscribe when using off with handler as arg', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    on('string', spy1)
    on('string', spy2)
    off('string', spy2)
    emit('string', PING)
    expect(spy1.called).to.equal(true)
    expect(spy2.called).to.equal(false)
    expect(spy1.calledWith(PONG)).to.equal(true)
    off('string', spy1)
  })

  it('should unsubscribe when using off', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    on('string', spy1)
    on('string', spy2)
    off('string')
    emit('string', PING)
    expect(spy1.called).to.equal(false)
    expect(spy2.called).to.equal(false)
  })
}

const mockDom = () => {
  const {window} = getMockDOM()
  global.window = window
  global.document = window.document
  setupNativeLink()
}

const teardownDom = () => {
  destroy()
  delete global.window
  delete global.document
}

describe('nativebridge unit test suite', () => {
  describe('iOs', () => {
    let hasPolyfilledBrowser = false

    before(() => {
      if (typeof window === 'undefined') {
        hasPolyfilledBrowser = true
        mockDom()
      }
      global.window.webkit = {messageHandlers: {nativebridgeiOS: {postMessage}}}
    })

    after(() => {
      if (hasPolyfilledBrowser) {
        teardownDom()
      }
    })
    testSuite('iOs')
  })

  describe('Android', () => {
    let hasPolyfilledBrowser = false

    before(() => {
      if (typeof window === 'undefined') {
        hasPolyfilledBrowser = true
        mockDom()
      }
      global.window.NativeBridgeAndroid = {send: sendMessage}
    })

    after(() => {
      if (hasPolyfilledBrowser) {
        teardownDom()
      }
    })

    testSuite('Android')
  })
})
