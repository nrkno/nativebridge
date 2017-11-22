console.log('nativebridge:', window.nativebridge)

window.nativebridge.on('test', function (data) {
  var json = JSON.stringify(data, null, '  ')
  document.querySelector('form').insertAdjacentHTML('afterend', '<pre>From native: ' + json + '</pre>')
})

document.addEventListener('submit', function (event) {
  event.preventDefault()
  window.nativebridge.emit('test', {text: event.target.text.value})
})
