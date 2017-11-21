// Call from webview to native
private class andriodJS {
	@JavascriptInterface
	fun test(string: String){
		Log.d("WebViewBridgeTest", "Called from web " + string)
	}
}

// Call from native to webView
private fun callWebView() {
	if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
		webview?.loadUrl("javascript:window['core-nativeweb']({\"hello\": \"is it me\"})")
	}
}
