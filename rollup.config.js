const buble = require('rollup-plugin-buble')
const serve = require('rollup-plugin-serve')
const { uglify } = require('rollup-plugin-uglify')
const { version } = require('./package.json')

export default [{
  input: 'lib/nativebridge.js',
  output: {
    format: 'cjs',
    file: 'lib/nativebridge.cjs.js',
    name: 'nativebridge'
  },
  plugins: [buble()]
}, {
  input: 'lib/nativebridge.js',
  output: {
    format: 'umd',
    banner: `/*! @nrk/nativebridge v${version} - Copyright (c) 2015-${new Date().getFullYear()} NRK */`,
    file: 'lib/nativebridge.min.js',
    name: 'nativebridge',
    sourcemap: true
  },
  plugins: [
    buble(),
    uglify({ output: { comments: /^!/ } }),
    Boolean(process.env.ROLLUP_WATCH) && serve({
      contentBase: 'lib',
      headers: { 'Content-Security-Policy': 'default-src \'self\' https://*.nrk.no; style-src \'self\' https://*.nrk.no \'unsafe-inline\'' }
    })
  ]
}]
