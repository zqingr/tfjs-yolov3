const path = require('path');

module.exports = function (env) {
  return {
    mode: 'development',
    context: path.join(process.cwd(), 'src'),
    entry: {
      'index': `./index.ts`
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js'
    },
    resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: [".ts", ".tsx", ".js"]
    },
    module: {
      rules: [
      {
        test: /\.(ts)$/,
        enforce: "pre",
        exclude: /node_modules/,
        loader: "eslint-loader",
        options: {
          fix: true
        }
      }, 
      {
        type: 'javascript/auto',
        test: /\.(json)$/,
        exclude: /node_modules/,
        loader: [
          `file-loader?publicPath=/&name=[name].[ext]`
        ]
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/, /\.ts$/],
          transpileOnly: true
        }
      },
      {
        test: /\.html$/,
        loader: 'raw-loader',
        exclude: ['./src/index.html']
      },
      {
        test: /\.(jpg|jpeg|gif|png)$/,
        loader: [
          `url-loader?limit=4112&publicPath=/&name=[name].[ext]`
        ]
      },
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }]
    },
    devServer: {
      port: 8000,
      host: 'localhost',
      historyApiFallback: true,
      watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
      },
      contentBase: ['src'],
      open: false,
      stats: {
        assets: true,
        children: false,
        chunks: false,
        hash: false,
        modules: false,
        publicPath: false,
        timings: true,
        version: false,
        warnings: true,
        colors: {
          green: '\u001b[32m',
        }
      }
    }
  }
}