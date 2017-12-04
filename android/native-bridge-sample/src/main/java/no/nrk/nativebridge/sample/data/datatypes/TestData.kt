package no.nrk.nativebridge.sample.data.datatypes;

import com.fasterxml.jackson.annotation.JsonProperty
import no.nrk.nativebridge.DataType

interface TestData {
    class In(@JsonProperty(required = true) val text: String) : DataType
    class Out() : DataType
}

