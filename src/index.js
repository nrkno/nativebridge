

module.exports = {
  subscribtions: {},
  on: function (type, handler) {
    Native.off(type, handler).push(handler)
  },
  off: function (type, handler) {
    var subs = window[KEY].subscribtions
    return subs[type] = handler? subs[type].filter(function(fn){ return fn !== handler }) : []
  },
  handleAction: function (action) {
    var subs = Native.subscribtions
    (subs[action.type] || []).map(function (handler) { handler(action) })
    (subs['*'] || []).map(function (handler) { handler(action) })
  },
  send: function (action) {
    if (!action.type) {
      console.log('please provide a action.type')
    } else if (window.webkit && window.webkit.messageHandlers) {
      window.webkit.messageHandlers.iOSJS.postMessage(action);
    } else if (window.andriodJS) {
      window.andriodJS.test(JSON.stringify(action));
    } else {
      console.log('no message handler context')
    }
  }
}
