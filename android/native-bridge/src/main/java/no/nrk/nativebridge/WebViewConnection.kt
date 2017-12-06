package no.nrk.nativebridge;

import com.fasterxml.jackson.databind.JsonMappingException
import com.fasterxml.jackson.databind.ObjectMapper
import org.json.JSONException
import org.json.JSONObject

class Connection(val objectMapper: ObjectMapper, private val javascriptExecutor: JavascriptExecutor) {

    val generators = mutableMapOf<String, (String) -> Unit>()

    /**
     * Adds a connection handler. Must be used webviews extending NativeBridgeWebView to handle
     * data flow back and forth between webview and native.
     *
     * @param type the name of the type to register. Corresponds to type used when sending and receiving
     * json
     *
     * @param callback
     */
    inline fun <reified T:DataType.In> addHandler(type: String, crossinline callback: (T, Connection) -> Unit) {
        val generator: (String) -> Unit = {
            try {
                val dataType: T = objectMapper.readValue(it, T::class.java)
                callback(dataType, this)
            } catch (exception: JsonMappingException){
                sendError(type, mutableListOf(WebViewConnectionError.InvalidDataForTypeHandler(type)))
            }
        }

        generators.put(type, generator)
    }

    /**
     * Sends data from native to webview
     */
    fun send(type: String, data: DataType.Out) {
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

    /**
     * Receives data from webview. If data is valid, generator() will be called with the data as
     * parameter.
     */
    fun receive(payload: String) {
        val json: JSONObject

        try {
            json = JSONObject(payload)
        } catch (exception: JSONException){
            sendError("error", mutableListOf(WebViewConnectionError.IllegalPayloadFormat()))
            return
        }

        val errors = validate(json)

        if (errors.isEmpty()){
            val generator = generators[json.getString("type")]
            generator!!(json.getString("data"))
        } else {
            if (json.hasType()){
                sendError(json.getString("type"), errors)
            } else {
                sendError("error", errors)
            }
        }
    }

    /**
     * Validates data from webview
     */
    private fun validate(json: JSONObject): MutableList<WebViewConnectionError> {
        val errors = mutableListOf<WebViewConnectionError>()

        if (!json.has("type")){
            errors.add(WebViewConnectionError.MissingFieldType())
        } else {
            if (generators[json.getString("type")] == null){
                errors.add(WebViewConnectionError.MissingTypeHandler())
            }
        }

        if (!json.has("data")){
            errors.add(WebViewConnectionError.MissingFieldData())
        }

        return errors
    }

    /**
     * Sends an error to the webview. Type will be determined by the caller, but will either
     * be the type received from the webview, or "error" if no type was passed from webview.
     */
    fun sendError(type: String, errors: MutableList<WebViewConnectionError>) {
        send(type, WebViewConnectionErrors(errors))
    }

    private fun JSONObject.hasType(): Boolean =
            this.has("type") && !this.getString("type").isBlank()
}

interface JavascriptExecutor {
    fun executeJavascript(script: String)
}