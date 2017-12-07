const button = document.querySelector('button')
const bridge = Object.assign({}, window.nativebridge)
const clearButton = document.getElementById('clear')
const payloadArea = document.getElementById('payload')
let counter = 0
const simulationCb = document.getElementById('simulation')
const output = document.getElementById('output')
console.log('nativebridge:', bridge)

const dispatchCustomEvent = (topic, data) => {
  window.dispatchEvent(new window.CustomEvent('nativebridge', {detail: {topic, data}}))
}

const backup = window.webkit

// mocked (injected) iOs handler
function postMessage ({topic, data}) {
  if (window.webkit !== backup) {
    if (topic === 'gaConf') {
      data.cid = 'MOCK_CID'
    } else if (topic === 'test') {
      data.echo = true
    } else {
      data = {
        errors: [{message: 'mock error', errorCode: 1}]
      }
    }
    data.simulation = true
  }
  dispatchCustomEvent(topic, data)
}

function setupSimulator () {
  if (simulationCb.checked) {
    window.webkit = {messageHandlers: {nativebridgeiOS: {postMessage}}}
  } else {
    window.webkit = backup
  }
}

bridge.on('error', (...args) => {
  output.insertAdjacentHTML('afterbegin', `<pre>${counter++} - From native: ${JSON.stringify(args)} </pre>`)
})

button.addEventListener('click', function (event) {
  setupSimulator()
  const {topic, data} = JSON.parse(payloadArea.innerHTML)

  const cb = function (payload) {
    bridge.off(topic, cb)
    var json = JSON.stringify(payload, null, '  ')
    output.insertAdjacentHTML('afterbegin', `<pre>${counter++} - From native: ${json} </pre>`)
  }
  bridge.on(topic, cb)
  bridge.emit(topic, data)
})

clearButton.addEventListener('click', function (event) {
  output.innerHTML = ' '
})
