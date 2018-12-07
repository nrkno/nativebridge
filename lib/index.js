var bridge = window.nativebridge
var submit = document.querySelector('[type="submit"]')
var reset = document.querySelector('[type="reset"]')
var simulation = document.querySelector('[name="simulation"]')
var payloadArea = document.getElementById('payload')
var output = document.getElementById('output')
var backup = window.webkit
var counter = 0

console.log('nativebridge:', bridge)

// mocked (injected) iOs handler
function postMessage ({ topic, data }) {
  if (window.webkit !== backup) {
    if (topic === 'gaConf') data.cid = 'MOCK_CID'
    else if (topic === 'test') data.echo = true
    else data = { errors: [{ message: 'mock error', errorCode: 1 }] }
    data.simulation = true
  }
  window.dispatchEvent(new window.CustomEvent('nativebridge', {
    detail: {
      topic: topic,
      data: data
    }
  }))
}

function setupSimulator () {
  if (!simulation.checked) window.webkit = backup
  else window.webkit = { messageHandlers: { nativebridgeiOS: { postMessage: postMessage } } }
}

function log (data) {
  output.insertAdjacentHTML('afterbegin', '<pre>' + (counter++) + ' - From native: ' + JSON.stringify(data, null, '  ') + ' </pre>')
}

bridge.on('error', function () { log(arguments) })

submit.addEventListener('click', function () {
  setupSimulator()
  var send = JSON.parse(payloadArea.innerHTML)
  var done = function (payload) {
    bridge.off(send.topic, done)
    log(payload)
  }
  bridge.on(send.topic, done)
  bridge.emit(send.topic, send.data)
})

reset.addEventListener('click', function () {
  output.innerHTML = ''
})
