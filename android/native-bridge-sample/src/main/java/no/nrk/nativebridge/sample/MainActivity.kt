package no.nrk.nativebridge.sample

import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import kotlinx.android.synthetic.main.activity_main.*
import no.nrk.nativebridge.sample.data.TestData

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        webview?.loadUrl("http://10.0.2.2:8080")

        webview?.connection?.addHandler("test", { data: TestData, connection ->
                val connectionData = TestData()
                connectionData.text = "I was called from native app"
                connection.send(connectionData, "test")
            }
        )
    }
}