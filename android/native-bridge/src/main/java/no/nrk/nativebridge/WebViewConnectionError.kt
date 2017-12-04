package no.nrk.nativebridge;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
enum class WebViewConnectionError(val code: Int, val message: String) {
    INVALID_JSON(1, "Unable to parse JSON"),
    TYPE_IS_NULL(2, "Type is null"),
    DATA_IS_NULL(3, "Data is null"),
    MISSING_TYPE_HANDLER(4, "No type handler found for type"),
}