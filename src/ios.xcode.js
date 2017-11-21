

webView.evaluateJavaScript("window.dispatchEvent(new CustomEvent('app.message', { detail: \(object) }))") { (value, error) in