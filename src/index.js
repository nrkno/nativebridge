const events = {}

function on (type, handler) {
  off(type, handler).push(handler)
}

function off (type, handler) {
  events[type] = handler ? events[type].filter((fn) => fn !== handler) : []
  return events[type]
}

function emit (type, ...value) {
  console.log(value)
  if (window.webkit && window.webkit.messageHandlers) {
    window.webkit.messageHandlers.nativebridge.postMessage({type, value})
  } else if (window.nativebridgeAndroid) {
    window.nativebridge.test(JSON.stringify({type, value}))
  } else {
    console.log('no message handler context')
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('webview-bridge', ({details}) => {
    (events[details.type] || []).concat(events['*'] || []).map((handler) => handler(details.value))
  })
  window.addEventListener('DOMContentLoaded', () => emit('ready'))
}

module.exports = { on, off, emit }
