console.log('nativebridge:', window.nativebridge)

window.nativebridge.on('test', function (payload) {
  var json = JSON.stringify(payload, null, '  ')
  document.querySelector('form').insertAdjacentHTML('afterend', '<pre>From native: ' + json + '</pre>')
})

document.querySelector('button').onclick = function (event) {
  window.nativebridge.emit('test', {
    text: document.querySelector('input').value
  })
}
