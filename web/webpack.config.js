const path = require('path')
const webpack = require('webpack')

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    'nativebridge': './index.js',
    'nativebridge.min': './index.js',
    'test': './test.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: '[name].js',
    library: 'nativebridge',
    libraryTarget: 'umd'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: [/node_modules(?!\/webpack-dev-server)/], // See https://github.com/webpack/webpack-dev-server/issues/1101#issuecomment-331651230
      use: [{
        loader: 'babel-loader',
        options: { presets: ['es2015'] }
      }]
    }]
  },
  devServer: {
    contentBase: [path.join(__dirname, 'src')],
    headers: {'Content-Security-Policy': `default-src 'self' https://*.nrk.no; style-src 'self' https://*.nrk.no 'unsafe-inline'`},
    historyApiFallback: { index: 'test.html' }, // Make test-file index
    inline: false                               // Must use for CSP
  },
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      sourceMap: true
    })
  ]
}
