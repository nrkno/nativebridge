# @nrk/nativebridge

Native Bridge is a lightweight and efficient bridge between webview and native app. It's primary use case is to share state between native apps and javascript in webviews.

- [Browser documentation](#browser)
- [Android documentation](https://github.com/nrkno/nativebridge-android)
- [iOS documentation](https://github.com/nrkno/nativebridge-ios)
- [How does it work](#how-does-it-work)

## Support
![Android](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/42.7.1/android/android_24x24.png)|![iOS](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/42.7.1/archive/safari-ios_1-6/safari-ios_1-6_24x24.png)
--- | ---
Tested on Android 4.4.4+ | iOS 10.2+

---

## Browser

Used as a producer/consumer-interface for passing messages to/from native app (iOs/Android). Following an `EventEmitter` interface (on/once/off/emit). In addition an RPC-interface makes calling native methods a breeze.

##### EMIT - *send to native*:
```js
nativebridge.emit('test', { foo: 'bar' })  // Emit 'test' event with data (must be object) to native
```

##### ON/ONCE - *receives from native*:
```js
nativebridge.on('test', (data) => {})       // Bind handler to 'test' event emitted from native
nativebridge.once('test', (data) => {})     // Bind handler to 'test' (one time only) event emitted from native
```

##### OFF: - *remove handler(s)*
```js
nativebridge.off('test')                    // Unbind all handlers for 'test' event
nativebridge.off('test', (data) => {})      // Unbind specific handler for 'test' event
```

##### RPC: - *make call to native app using topic as contract*
Make a remote procedure call (RPC) using nativebridge interfaces as described above.
Resolves with data on completion, or rejects with error details from the app (or timeout).
```js
// Auto-bind handlers (once/emit) to complete an RPC-call to native
nativeBridge.rpc({                          
  topic: 'test',                             // using 'test' as event
  data: {},                                 // with data (args)
  resolve: (data) => {},                    // using callback on success
  reject: (err) => {},                      // or rejection on error
  timeout: 1000                             // with a timeout threshold
})
```


### Installation

##### USE WITH NPM:
```bash
npm install @nrk/nativebridge --save
```
```js
import nativebridge from '@nrk/nativebridge'
```
##### USE WITH SCRIPT TAG:
```html
<script src="https://static.nrk.no/nativebridge/X.X.X/nativebridge.min.js"></script>
<!-- window.nativebridge is now defined -->
```
##### USE WITH REQUIRE.JS:
```js
require(['https://static.nrk.no/nativebridge/X.X.X/nativebridge.min.js'], function(nativebridge) {
  /* code here */
});
```

---

## How does it work

##### Emit
A data object is sent using `topic` as topic to an exposed method on either:
- *Android*:
```js
window.webkit.messageHandlers.nativebridgeiOS.postMessage({topic: "test", data: {foo: "bar"}})
```
- *iOS*:
```js
window.NativeBridgeAndroid.send(JSON.stringify({topic: "test", data: {foo: "bar"}}))
```

##### Android/iOS handler
Topic-handlers are mapped to native functions, using data-object as an argument e.g `topicHandler({topic: "test", data: {foo: "bar"}})`. The app injects a js-snippet to dispatch a message back to the webpage using CustomEvents:
```javascript
window.dispatchEvent(new CustomEvent('nativebridge', { detail: {topic, data} }))
```

##### On
The CustomEvent dispatched from the native app is ran using attached callback-handlers on the given topic.

##### Error handling
If an error occurs in the native app, an Error object will be rejected, eg.
```js
err.message = '[{message: "no handler available", errorCode: 100}]'
```

##### RPC
The RPC-method is made to simplify on/off/emit-logistics. In addition it supports a timeout, which will throw an error if timeout is reached:
```js
err.message = 'RPC for test using {} timed out after 1000ms'
```
---

## Local development (web)
First clone `@nrk/nativebridge` and install its dependencies:

```bash
git clone git@github.com:nrkno/nativebridge.git
cd nativebridge/web
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
