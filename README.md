# @nrk/nativebridge

> Lightweight and efficient bridge between webview and native app
> Primary use case is for sharing state.

- [Browser documentation](#browser)
- [Android documentation](#android)
- [iOS documentation](#ios)

## Support
![iOS](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/42.7.1/archive/safari-ios_1-6/safari-ios_1-6_24x24.png) | ![Android](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/42.7.1/android/android_24x24.png)
--- | ---
iOS 10.2+ | Android 4.4.4+

---

## Browser

Used as a producer/consumer-interface for passing messages to/from native app (iOs/Android). Following an `EventEmitter` interface (on/once/off/emit). In addition an RPC method makes calling native interfaces a breeze.

##### EMIT - *send to native*:
```js
nativebridge.emit('test', { foo: 'bar' })  // Emit 'test' event with data (must be object) to native
```
This will be converted to an exposed method on iOs:
`window.webkit.messageHandlers.nativebridgeiOS.postMessage({type: "test", data: {foo: "bar"}})`
or Android:
`window.NativeBridgeAndroid.send(JSON.stringify({type: "test", data: {foo: "bar"}}))`

##### ON/ONCE - *receives from native*:
```js
nativebridge.on('test', (data) => {})       // Bind handler to 'test' event emitted from native
nativebridge.once('test', (data) => {})     // Bind handler to 'test' (one time only) event emitted from native
```
`data` is an object with response from native, e.g `{foo: "baz"}`

##### OFF:
```js
nativebridge.off('test')                    // Unbind all handlers for 'test' event
nativebridge.off('test', (data) => {})      // Unbind specific handler for 'test' event
```
Please note: provided callback must be the same as used in `on`-handler

##### RPC:
Make a remote procedure call (RPC) using nativebridge interfaces as described above.
Supports error handling through timeouts and an errors array.

**Example:**
```js
// Auto-bind handlers (once/emit) to complete an RPC-call to native
nativeBridge.rpc({                          
  type: 'test',                             // using 'test' as event
  data: {},                                 // with data (args)
  resolve: (data) => {},                    // using callback on success
  reject: (err) => {},                      // or rejection on error
  timeout: 1000                             // with a timeout threshold
})
```

This will emit a message to nativeApp (iOs used here):
`window.webkit.messageHandlers.nativebridgeiOS.postMessage({type: "test", data: {foo: "bar"}})`

If an error occurs in the native app, an Error object will be rejected:
`err.message = '[{message: "no handler available", errorCode: 100}]'`

If the native app does not respond within give timeout, an Error object will be rejected:
`err.message = 'RPC for test using {} timed out after 1000ms'`

If the RPC succeeds, the resolve-callback will be ran with the following data object
`{foo: "baz"}`


### Installation

##### USE WITH NPM:
```
npm install @nrk/nativebridge --save
```
```
import nativebridge from '@nrk/nativebridge'
```
##### USE WITH SCRIPT TAG:
```
<script src="https://static.nrk.no/nativebridge/X.X.X/nativebridge.min.js"></script>
<!-- window.nativebridge is now defined -->
```
##### USE WITH REQUIRE.JS:
```
require(['https://static.nrk.no/nativebridge/X.X.X/nativebridge.min.js'], function(nativebridge) {
  /* code here */
});
```

---

## Android

Describe usage here

##### EXAMPLE:
```
private class nativebridgeAndroid {
  @JavascriptInterface

  // Receives from webview
  fun on(json: String){
    Log.d("WebViewBridgeTest", "Called from web " + json)
  }

  // Send to webview
  fun emit(type: String, data: Object) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      var event = JSON.stringify({detail: {type, data}})
      webView?.loadUrl("javascript:window.dispatchEvent(new CustomEvent('nativebridge', ' + event + ' ))")
    }
  }
}

// Add interface to webview
webView.addJavascriptInterface(new nativebridgeAndroid(), "interface");
```

---

## iOS

Describe usage here

##### EXAMPLE:

```
webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('nativebridge', { detail: \(object) }))") {
  (value, error) in
})
```

---

## Local development
First clone `@nrk/nativebridge` and install its dependencies:

```bash
git clone git@github.com:nrkno/nativebridge.git
cd nativebridge
npm install && npm start
```

## Building and committing
After having applied changes, remember to build before pushing the changes upstream.

```bash
git checkout -b feature/my-changes
# update the source code
npm run build
git commit -am "Add my changes"
git push origin feature/my-changes
# then make a PR to the master branch,
# and assign another developer to review your code
```

> NOTE! Please also make sure to keep commits small and clean (that the commit message actually refers to the updated files).  
> Stylistically, make sure the commit message is **Capitalized** and **starts with a verb in the present tense** (for example `Add minification support`).
