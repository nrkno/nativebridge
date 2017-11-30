var button = document.querySelector('button')
var bridge = Object.assign({}, window.nativebridge)
console.log('nativebridge:', bridge)

bridge.on('test', function (payload) {
  var json = JSON.stringify(payload, null, '  ')
  button.insertAdjacentHTML('afterend', '<pre>From native: ' + json + '</pre>')
})

button.addEventListener('click', function (event) {
  var type = document.getElementById('type').textContent.trim()
  var data = document.getElementById('data').textContent.trim()
  var json = JSON.parse('{' + data + '}')

  bridge.emit(type, json)
})
