var button = document.querySelector('button')
var bridge = Object.assign({}, window.nativebridge)
console.log('nativebridge:', bridge)

bridge.on('test', function (payload) {
  var json = JSON.stringify(payload, null, '  ')
  button.insertAdjacentHTML('afterend', '<pre>From native: ' + json + '</pre>')
})

button.addEventListener('click', function (event) {
  var data = document.getElementById('type')
  var type = document.getElementById('data')

  bridge.emit(type, JSON.parse(data))
})
