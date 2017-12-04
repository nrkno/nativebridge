package no.nrk.nativebridge;

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import org.json.JSONException
import org.json.JSONObject


interface JavascriptExecutor {
    fun executeJavascript(script: String)
}

class Connection(val objectMapper: ObjectMapper,
                 private val javascriptExecutor: JavascriptExecutor) {

    val generators = mutableMapOf<String, (String) -> Unit>()

    inline fun <reified T:DataType> addHandler(type: String, crossinline callback: (T, Connection) -> Unit) {
        val generator: (String) -> Unit = {
            val dataType: T = objectMapper.readValue(it, T::class.java)
            callback(dataType, this)
        }

        generators.put(type, generator)
    }

    fun receive(payload: String) {
        val json: JSONObject

        try {
            json = JSONObject(payload)
        } catch (exception: JSONException){
            sendError("error", mutableListOf(WebViewConnectionError.INVALID_JSON))
            return
        }

        val errors = validate(json)

        if (errors.isEmpty()){
            val generator = generators[json.getString("type")]
            generator!!(json.getString("data"))
        } else {
            if (hasType(json)){
                sendError(json.getString("type"), errors)
            } else {
                sendError("error", errors)
            }
        }
    }

    private fun validate(json: JSONObject): MutableList<WebViewConnectionError> {
        val errors = mutableListOf<WebViewConnectionError>()

        if (!json.has("type")){
            errors.add(WebViewConnectionError.TYPE_IS_NULL)
        } else {
            if (generators[json.getString("type")] == null){
                errors.add(WebViewConnectionError.MISSING_TYPE_HANDLER)
            }
        }

        if (!json.has("data")){
            errors.add(WebViewConnectionError.DATA_IS_NULL)
        }

        return errors
    }

    private fun hasType(json: JSONObject) =
            json.has("type") && !json.getString("type").isBlank()

    fun send(type: String, data: DataType) {
        val jsonData = objectMapper.writeValueAsString(data)
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

    fun sendError(type: String, errors: MutableList<WebViewConnectionError>) {
        send(type, WebViewConnectionErrors(errors))
    }

}
