package no.nrk.nativebridge.sample;

import android.util.Log
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.KotlinModule
import junit.framework.Assert.assertEquals
import junit.framework.Assert.assertTrue
import no.nrk.nativebridge.Connection
import no.nrk.nativebridge.DataType
import no.nrk.nativebridge.ConnectionErrorData
import no.nrk.nativebridge.JavascriptExecutor
import org.json.JSONObject
import org.junit.Test

class ConnectionTest {
    val mapper = ObjectMapper().registerModule(KotlinModule())!!

    @Test
    fun testSend(){
        val javascript = getJavaScript("testType", TestData("value"))

        val connection = Connection(object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertEquals(javascript, script)
            }
        })

        val dataType = TestData("value")
        connection.send("testType", dataType)
    }

    @Test
    fun testReceive(){
        val connection = Connection(object: JavascriptExecutor{
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

        val connection = Connection(object: JavascriptExecutor{
            override fun executeJavascript(script: String) {
                assertTrue("bla" == script)
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