package no.nrk.nativebridge;

import com.fasterxml.jackson.annotation.JsonFormat
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
        val errors = mutableListOf<Error>()
        val json = JSONObject(payload)
        var type = ""

        if (json.has("type")){
            if (json.getString("type").isNotBlank()){
                type = json.getString("type")
            } else {
                errors.add(Error.TYPE_IS_BLANK)
            }
        } else {
            errors.add(Error.TYPE_NOT_FOUND)
        }

        var data: JSONObject? = null

        if (json.getJSONObject("data") != null){
            data = json.getJSONObject("data")
        } else {
            errors.add(Error.DATA_IS_NULL)
        }

        if (generators[type] != null){
            val generator = generators[type]
            generator!!(data.toString())
            return
        } else {
            errors.add(Error.NO_GENERATOR_FOUND_FOR_TYPE)
        }

        sendError(errors)
    }

    fun send(type: String, data: DataType) {
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

    fun sendError(errors: MutableList<Error>) {
        send("error", ConnectionErrorData(errors))
    }


    @JsonFormat(shape = JsonFormat.Shape.OBJECT)
    enum class Error(val code: Int, val message: String) {
        TYPE_NOT_FOUND(1, "Type not found"),
        TYPE_IS_BLANK(2, "Type is blank"),
        DATA_IS_NULL(3, "Data is null"),
        NO_GENERATOR_FOUND_FOR_TYPE(4, "No generator found for type")
    }
}
