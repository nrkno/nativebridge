package no.nrk.nativebridge;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
enum class WebViewConnectionError(val code: Int, val message: String) {
    ILLEGAL_PAYLOAD_FORMAT(1, "Illegal payload format"),
    MISSING_FIELD_TYPE(2, "Missing field: 'type'"),
    MISSING_FIELD_DATA(3, "Missing field: 'data'"),
    MISSING_TYPE_HANDLER(4, "Missing type handler"),
    INVALID_DATA_FOR_HANDLER(5, "Invalid data for type. Excepted data type.") // TODO
}
