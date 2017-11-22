# @nrk/nativebridge

> Lightweight and efficient bridge between webview and native app

- [Browser documentation](#browser)
- [Android documentation](#android)
- [iOS documentation](#ios)

## Support
![iOS](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/42.7.1/archive/safari-ios_1-6/safari-ios_1-6_24x24.png) | ![Android](https://cdnjs.cloudflare.com/ajax/libs/browser-logos/42.7.1/android/android_24x24.png)
--- | ---
iOS 10.2+ | Android 4.4.4+

---

## Browser

Describe usage here

##### Emit - *send to native*
```
nativebridge.emit('test', { foo: 'bar' })  // Emit 'test' event with data object to native
```
##### On  *receives from native*
```
nativebridge.on('test', (data) => {})      // Bind handler to 'test' event emitted from native
```
##### Off
```
nativebridge.off('test')                   // Unbind all handlers for 'test' event
nativebridge.off('test', (data) => {})     // Unbind specific handler for 'test' event
```

## Android

Describe usage here

##### Example
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
      webview?.loadUrl("javascript:window.dispatchEvent(new CustomEvent('webview-bridge', ' + event + ' ))")
    }
  }
}

// Add interface to webview
webView.addJavascriptInterface(new nativebridgeAndroid(), "interface");
```

## iOS

Describe usage here

##### Example

```
webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('webview-bridge', { detail: \(object) }))") {
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
