const events = {}
const DEFAULT_TIMEOUT = 1000

export function on (type, handler) {
  if (typeof handler !== 'function') {
    throw new Error('Handler must be of type function')
  }
  (events[type] = events[type] || []).push(handler)
}

export function off (type, handler) {
  events[type] = (events[type] || []).filter((fn) => handler && fn !== handler)
}

export function once (type, handler) {
  const newHandler = function (...args) {
    off(type, newHandler)
    handler(...args)
  }
  on(type, newHandler)
}

export function emit (type, data = {}) {
  if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.nativebridgeiOS.postMessage({type, data})
  } else if (window.NativeBridgeAndroid) {
    window.NativeBridgeAndroid.send(JSON.stringify({type, data}))
  } else {
    throw new Error('No native bridge defined')
  }
}

export function validateInput ({type, data, resolve, reject, timeout}) {
  if (typeof type === 'undefined' || typeof type !== 'string') {
    throw TypeError('type argument must be a String')
  }
  if (typeof data === 'undefined' || data === null || typeof data !== 'object') {
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

export function rpc ({type, data, resolve, reject, timeout = DEFAULT_TIMEOUT}) {
  try {
    validateInput({type, resolve, reject, data, timeout})
    let timedout = false
    const timer = setTimeout(function () {
      timedout = true
      reject(new Error(`RPC for ${type} using ${data} timed out after ${timeout}ms`))
    }, timeout)
    const done = (args) => {
      clearTimeout(timer)
      if (args.errors) {
        reject(new Error(JSON.stringify(args.errors)))
      } else if (!timedout) {
        resolve(args)
      }
    }
    once(type, done)
    emit(type, data)
  } catch (e) {
    reject(e)
  }
}
function onNative ({detail: {type, data}}) {
  (events[type] || []).forEach((handler) => handler(data))
}

export function setupNativeLink () {
  window.addEventListener('nativebridge', onNative)
}

export function destroy () {
  Object.keys(events).forEach((type) => {
    Object.keys(events[type]).forEach((handler) => {
      delete events[type][handler]
    })
    delete events[type]
  })
  window.removeEventListener('nativebridge', onNative)
}

if (typeof window !== 'undefined') {
  setupNativeLink()
}
