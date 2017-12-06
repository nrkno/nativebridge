package no.nrk.nativebridge.sample.data.datatypes;

import com.fasterxml.jackson.annotation.JsonProperty
import no.nrk.nativebridge.DataType

class TestData {
    class In(@JsonProperty(required = true) val text: String) : DataType.In
    class Out(val value: String) : DataType.Out
}

