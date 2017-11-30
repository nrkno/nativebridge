package no.nrk.nativebridge

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.util.AttributeSet
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.fasterxml.jackson.databind.exc.InvalidTypeIdException

@SuppressLint("SetJavaScriptEnabled")
class NativeBridgeWebView(context: Context, attrs: AttributeSet) : WebView(context, attrs), JavascriptExecutor {

    val data = mutableMapOf<String, () -> Unit>()
    val connection: Connection

    init {
        @SuppressLint("SetJavaScriptEnabled")
        connection = Connection(this)
        settings?.javaScriptEnabled = true
        addJavascriptInterface(NativeBridgeAndroid(), "NativeBridgeAndroid")
    }

    private inner class NativeBridgeAndroid {
        @JavascriptInterface
        fun send(json: String){
            try {
                val runnableCode = Runnable { connection.receive(json) }
                handler.post(runnableCode)
            } catch (e: InvalidTypeIdException){
                Log.d("NativeBridge", "Type ID '${e.typeId}' not recognized. Ignoring.")
            }
        }
    }

    override fun executeJavascript(javascript: String){
        Log.d("NativeBridge", "Passing $javascript to web view")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT){
            evaluateJavascript(javascript, { /* no-op */ })
        } else {
            loadUrl(javascript)
        }
    }
}