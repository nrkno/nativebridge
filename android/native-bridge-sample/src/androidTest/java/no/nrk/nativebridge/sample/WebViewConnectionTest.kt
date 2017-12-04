package no.nrk.nativebridge.sample;

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import junit.framework.Assert.assertEquals
import junit.framework.Assert.assertTrue
import no.nrk.nativebridge.Connection
import no.nrk.nativebridge.DataType
import no.nrk.nativebridge.WebViewConnectionError
import no.nrk.nativebridge.JavascriptExecutor
import org.json.JSONObject
import org.junit.Test

class ConnectionTest {
    private val mapper = ObjectMapper().registerModule(KotlinModule())!!

    @Test
    fun testSendSuccessful(){
        val javascript = getJavaScript("testType", TestData("value"))

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertEquals(javascript, script)
            }
        })

        val dataType = TestData("value")
        connection.send("testType", dataType)
    }

    @Test
    fun testReceiveSuccessful(){
        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                /** no-op */
            }
        })

        val javascript = """{"type":"testType","data":{"key":"value"}}""".trimIndent()

        connection.addHandler("testType", { data: TestData, connection ->
            assertEquals("value", data.key)
        })

        connection.receive(javascript)
    }

    @Test
    fun testErrorReceiveNoType(){
        val javascript = """{"data":{"key":"value"}}""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(WebViewConnectionError.TYPE_IS_NULL.message))
            }
        })

        connection.receive(javascript)
    }



    @Test
    fun testErrorReceiveNoData(){
        val javascript = """{"type":"testType"}""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(WebViewConnectionError.DATA_IS_NULL.message))
            }
        })

        connection.receive(javascript)
    }

    @Test
    fun testErrorInvalidJson(){
        val javascript = """abc""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(WebViewConnectionError.INVALID_JSON.message))
            }
        })

        connection.receive(javascript)
    }

    @Test
    fun testErrorInvalidType(){
        val javascript = """{"type":"invalid","data":{"key":"value"}}""".trimIndent()

        val connection = Connection(mapper, object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue(script.contains(""""type":"invalid""") && script.contains(WebViewConnectionError.MISSING_TYPE_HANDLER.message))
            }
        })

        connection.receive(javascript)
    }

    private fun getJavaScript(type: String, expectedDataType: DataType) : String {
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

data class TestData(val key: String) : DataType