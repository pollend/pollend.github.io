const Path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// webpack.config.js
module.exports = {
    entry: {
      app: Path.resolve(__dirname, './src/scripts/index.js')
    },
    output: {
        path: Path.join(__dirname, 'build'),
        filename: '[name].js'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                "css-loader", // translates CSS into CommonJS
                "sass-loader" // compiles Sass to CSS, using Node Sass by default
            ]
        },{
            test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg|otf)(\?[a-z0-9=.]+)?$/,
            use: [{
                loader: 'file-loader',
                options: {
                    publicPath: '/build/'
                },
            }]
        }]
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: "style.css",
            chunkFilename: "[id].css"
        })
    ]
};