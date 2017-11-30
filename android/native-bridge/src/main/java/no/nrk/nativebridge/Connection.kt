package no.nrk.nativebridge;

import android.webkit.ValueCallback
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.json.JSONObject


interface JavascriptExecutor {
    fun executeJavascript(script: String)
}

class Connection(private val javascriptExecutor: JavascriptExecutor) {
    val generators = mutableMapOf<String, (String) -> Unit>()
    val mapper = ObjectMapper().registerModule(KotlinModule())!!

    inline fun <reified T:DataType> addHandler(type: String, crossinline callback: (T, Connection) -> Unit) {
        val generator: (String) -> Unit = {
            val dataType: T = mapper.readValue(it, T::class.java)
            callback(dataType, this)
        }

        generators.put(type, generator)
    }

    fun receive(payload: String) {
        val json = JSONObject(payload)

        val type = json.get("type")
        val data = json.get("data")

        val generator = generators[type]

        generator!!(data.toString())
    }

    fun send(data: DataType, type: String) {
        val jsonData = mapper.writeValueAsString(data)
        val jsonDataObject = JSONObject(jsonData)
        val jsonObject = JSONObject()

        jsonObject.put("type", type)
        jsonObject.put("data", jsonDataObject)

        val javascript =
            """
            javascript:window.dispatchEvent(
                new CustomEvent("nativebridge", {
                        "detail": $jsonObject
                    }
                )
            )
            """.trimIndent()
        javascriptExecutor.executeJavascript(javascript)

    }

}
