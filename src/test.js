var button = document.querySelector('button')
var bridge = Object.assign({}, window.nativebridge)
console.log('nativebridge:', bridge)

bridge.on('test', function (payload) {
  var json = JSON.stringify(payload, null, '  ')
  button.insertAdjacentHTML('afterend', '<pre>From native: ' + json + '</pre>')
})

button.onclick = function (event) {
  bridge.emit('test', {
    text: document.querySelector('input').value
  })
}
