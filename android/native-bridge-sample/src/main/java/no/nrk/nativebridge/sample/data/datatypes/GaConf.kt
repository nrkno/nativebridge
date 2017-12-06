package no.nrk.nativebridge.sample.data.datatypes

import no.nrk.nativebridge.DataType

class GaConf {
    class In : DataType.In
    class Out(val cid: String) : DataType.Out
}