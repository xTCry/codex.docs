import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import { fileURLToPath } from 'url';
import * as webpack from 'webpack';


export default (): webpack.Configuration => {
  return {
    entry: './src/frontend/js/app.ts',
    output: {
      filename: '[name].bundle.js',
      path: path.resolve(__dirname, './public/dist'),
      libraryExport: 'default', // uses to export .default field of app.js exported class instance
    },
    module: {
      rules: [
        {
          test: /\.p?css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                // you can specify a publicPath here
                // by default it use publicPath in webpackOptions.output
                // publicPath: '../',
              },
            },
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',
            },
          ],
        },
        {
          test: /\.(j|t)s$/,
          exclude: /(node_modules|bower_components)/,
          resolve: {
            /**
             * Disable mandatory to specify full paths with extensions using '"type": "module"' in package.json
             * @see https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
             * @see https://stackoverflow.com/questions/69427025/programmatic-webpack-jest-esm-cant-resolve-module-without-js-file-exten
             */
            fullySpecified: false,
          },
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        filename: '[name].css',
      }),
    ],
    optimization: {
      splitChunks: false,
    },
    resolve: { extensions: ['.ts', '.tsx', '.jsx', '.js', '...'] },

    /**
     * Show less logs while building
     * https://webpack.js.org/configuration/stats/
     */
    stats: 'minimal',
  };
};
