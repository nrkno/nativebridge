package no.nrk.nativebridge.sample;

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import no.nrk.nativebridge.Connection
import no.nrk.nativebridge.DataType
import no.nrk.nativebridge.WebViewConnectionError
import no.nrk.nativebridge.JavascriptExecutor
import no.nrk.nativebridge.sample.data.datatypes.TestData
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ConnectionTest {

    private val mapper = ObjectMapper().registerModule(KotlinModule())!!

    /**
     * Tests that sending valid data from webview to native works as expected
     */
    @Test
    fun testSendSuccessful(){
        val javascript = getJavaScript("testType", TestData.Out("someText"))

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertEquals(javascript, script)
            }
        })

        val dataType = TestData.Out("someText")
        connection.send("testType", dataType)
    }

    /**
     * Tests that receiving valid data from webview works as expected
     */
    @Test
    fun testReceiveSuccessful(){
        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                /** no-op */
            }
        })

        val javascript = """{"type":"testType","data":{"text":"someText"}}""".trimIndent()

        connection.addHandler("testType", { data: TestData.In, _ ->
            assertEquals("someText", data.text)
        })

        connection.receive(javascript)
    }

    /**
     * Tests that error is returned when payload doesn't contain "type" object
     */
    @Test
    fun testMissingFieldTypeShouldReturnError(){
        val javascript = """{"data":{"key":"value"}}""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(WebViewConnectionError.MissingFieldType().message))
            }
        })

        connection.receive(javascript)
    }


    /**
     * Tests that error is returned when payload doesn't contain "data" object
     */
    @Test
    fun testMissingFieldDataShouldReturnError(){
        val javascript = """{"type":"testType"}""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(WebViewConnectionError.MissingFieldData().message))
            }
        })

        connection.receive(javascript)
    }

    /**
     * Tests that error is returned when payload isn't valid JSON
     */
    @Test
    fun testIllegalPayloadResultsInError(){
        val javascript = """abc""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(WebViewConnectionError.IllegalPayloadFormat().message))
            }
        })

        connection.receive(javascript)
    }

    /**
     * Tests that error is returned when a type handler for specified "type" hasn't been added
     */
    @Test
    fun testMissingTypeHandlerShouldReturnError(){
        val javascript = """{"type":"invalid","data":{"key":"value"}}""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(""""type":"invalid""") && script.contains(WebViewConnectionError.MissingTypeHandler().message))
            }
        })

        connection.receive(javascript)
    }

    /**
     * Tests that error is returned when payload contains data that is unrecognizable. This will happen
     * if the data object has @JsonProperty(required = true) field annotations that isn't satisified.
     */
    @Test
    fun testInvalidDataForHandlerShouldReturnError(){
        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(""""type":"testType"""")
                        && script.contains(WebViewConnectionError.InvalidDataForTypeHandler("testType").message))
            }
        })

        val javascript = """{"type":"testType","data":{"texttt":"someTextForInvalidKey"}}""".trimIndent()

        connection.addHandler("testType", { _: TestData.In, _ ->
            /** no-op */
        })

        connection.receive(javascript)
    }

    private fun getJavaScript(type: String, expectedDataType: DataType.Out) : String {
        val json = JSONObject()

        val jsonData = mapper.writeValueAsString(expectedDataType)
        val jsonDataObject = JSONObject(jsonData)

        json.put("type", type)
        json.put("data", jsonDataObject)

        val javascript =
                """
            javascript:window.dispatchEvent(
                new CustomEvent("nativebridge", {
                        "detail": $json
                    }
                )
            )
            """.trimIndent()

        return javascript
    }
}
