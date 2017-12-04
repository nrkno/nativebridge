package no.nrk.nativebridge.sample

import android.content.SharedPreferences
import android.os.Build
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView.setWebContentsDebuggingEnabled
import android.webkit.WebViewClient
import kotlinx.android.synthetic.main.activity_main.*
import no.nrk.nativebridge.sample.data.datatypes.GaConf
import no.nrk.nativebridge.sample.data.datatypes.TestData


class WebViewActivity : AppCompatActivity() {

    lateinit private var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        prefs = getPreferences(android.content.Context.MODE_PRIVATE)

        val url = prefs.getString("url", "http://10.0.2.2:8080")
        etUrl.setText(url)

        webview?.apply {
            connection.addHandler("gaConf", { _ : GaConf.In, connection ->
                val gaConf = GaConf.Out("35009a79-1a05-49d7-b876-2b884d0f825b")
                connection.send("gaConf", gaConf)
                }
            )

            connection.addHandler("testData", { _ : TestData.In, connection ->
                /* no-op */
            })

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                setWebContentsDebuggingEnabled(true)
            }

            webViewClient = WebViewClient()
            loadUrl(url)
        }

        btnSetUrl.setOnClickListener {
            val etUrl = etUrl.text.toString()
            prefs.edit().putString("url", etUrl).apply()

            webview.loadUrl(etUrl)
        }
    }
}
