const DEFAULT_TIMEOUT = 1000
export const events = {}

export function on (topic, handler) {
  if (typeof topic !== 'string') throw new Error('topic must be a string')
  if (typeof handler !== 'function') throw new Error('Handler must be of topic function')
  ;(events[topic] = events[topic] || []).push(handler)
}

export function off (topic, handler) {
  if (typeof topic !== 'string') throw new Error('topic must be a string')
  events[topic] = (events[topic] || []).filter((fn) => handler && fn !== handler)
}

export function once (topic, handler) {
  if (typeof topic !== 'string') throw new Error('type must be a string')
  if (typeof handler !== 'function') throw new Error('Handler must be of type function')
  const newHandler = (...args) => {
    off(topic, newHandler)
    handler(...args)
  }
  on(topic, newHandler)
}

export function emit (topic, data = {}) {
  if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.nativebridgeiOS.postMessage({ topic, data })
  } else if (window.NativeBridgeAndroid) {
    window.NativeBridgeAndroid.send(JSON.stringify({ topic, data }))
  } else {
    throw new Error('No native bridge defined')
  }
}

export function validateRpcInput ({ topic, data, resolve, reject, timeout }) {
  if (typeof topic !== 'string') {
    throw TypeError('topic argument must be a String')
  }
  if (data === null || typeof data !== 'object') {
    throw TypeError('data argument must be an Object')
  }
  if (typeof resolve !== 'function') {
    throw new TypeError('resolve must be a function')
  }
  if (typeof reject !== 'function') {
    throw new TypeError('resolve must be a function')
  }
  if (typeof timeout !== 'number') {
    throw new TypeError('timeout must be a number')
  }
  return true
}

export function rpc ({ topic, data, resolve, reject, timeout = DEFAULT_TIMEOUT }) {
  try {
    validateRpcInput({ topic, resolve, reject, data, timeout })
    let timedout = false
    const timer = setTimeout(function () {
      timedout = true
      reject(new Error(`RPC for ${topic} using ${data} timed out after ${timeout}ms`))
    }, timeout)
    const done = (args) => {
      clearTimeout(timer)
      if (args.errors) reject(new Error(JSON.stringify(args.errors)))
      else if (!timedout) resolve(args)
    }
    once(topic, done)
    emit(topic, data)
  } catch (err) {
    reject(err)
  }
}

function onNative ({ detail: { topic, data } }) {
  (events[topic] || []).forEach((handler) => handler(data))
}

export function setupNativeLink () {
  window.addEventListener('nativebridge', onNative)
}

export function destroy () {
  Object.keys(events).forEach((topic) => (events[topic] = []))
  if (typeof window !== 'undefined') {
    window.removeEventListener('nativebridge', onNative)
  }
}

if (typeof window !== 'undefined') setupNativeLink()
