const events = {}

export function on (type, handler) {
  if (typeof handler !== 'function') {
    throw new Error('Handler must be of type function')
  }
  (events[type] = events[type] || []).push(handler)
}

export function off (type, handler) {
  events[type] = (events[type] || []).filter((fn) => handler && fn !== handler)
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
