package no.nrk.nativebridge.sample.data.datatypes

import no.nrk.nativebridge.DataType

class GaConf {
    class In : DataType
    class Out(val cid: String) : DataType
}