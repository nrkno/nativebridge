package no.nrk.nativebridge

import com.fasterxml.jackson.annotation.JsonFormat

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
sealed class WebViewConnectionError(val code: Int, val message: String) {
    class IllegalPayloadFormat : WebViewConnectionError(1, "Illegal payload format")
    class MissingFieldType : WebViewConnectionError(2, "Missing field: 'type'")
    class MissingFieldData : WebViewConnectionError(3, "Missing field: 'data'")
    class MissingTypeHandler : WebViewConnectionError(4, "Missing type handler")
    class InvalidDataForTypeHandler(val type: String) : WebViewConnectionError(5, "Invalid data for type. Excepted data type '$type'")
}
