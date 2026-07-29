"use strict";

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanCSSPlugin = require("less-plugin-clean-css");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

let bundleOutputDir = './wwwroot/dist';
const frontDir = path.resolve(__dirname, "src", "frontend");

const lessLoaderOptions = { webpackImporter: true, lessOptions: { math: 'always', plugins: [new CleanCSSPlugin({ advanced: false })] } };
var splitChunks = {
    cacheGroups: {
        vendors: {
            test: /[\\/]node_modules[\\/]/,
            reuseExistingChunk: true,
            enforce: true
        },
        styles: {
            test: /\.(css|scss|less)$/, // needed so imports of the same less file are not duplicated in the output
            reuseExistingChunk: true,
            enforce: true
        },
        images: {
            test: /\.(svg|jpg|png)$/,
            reuseExistingChunk: true,
            enforce: true
        }
    }
};

module.exports = (env) => {
    const isDevBuild = process.env.NODE_ENV !== "production";

    console.log(`NODE_ENV: "${process.env.NODE_ENV}"`);
    console.log(`isDevBuild: ${isDevBuild}`);

    const getFilePath = (relativePath) => relativePath;

    return [{
        mode: isDevBuild ? "development" : "production",
        entry: {
            app: path.resolve(__dirname, 'src', 'frontend', 'index.ts')
        },
        resolve: {
			extensions: ['.js', '.jsx', '.ts', '.tsx', '.less'],
			// `file:`-linked @brandup packages live outside this folder, so core-js imports
			// injected into their code must still resolve against the example's own deps
			modules: [path.resolve(__dirname, 'node_modules'), 'node_modules']
		},
        output: {
            path: path.join(__dirname, bundleOutputDir),
            filename: getFilePath('[name].js'),
            chunkFilename: isDevBuild ? getFilePath('[name].js') : getFilePath('[name].[contenthash].js'),
            iife: true,
            clean: true,
            publicPath: '/'
        },
        module: {
            rules: [
                {
                    test: /\.(?:ts|js|mjs|cjs)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader'
                    }
                },
                {
                    test: /\.(le|c)ss$/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader },
                        { loader: 'css-loader', options: { importLoaders: 2 } },
                        { loader: 'less-loader', options: lessLoaderOptions }
                    ]
                },
                {
                    test: /\.html$/,
					//include: /pages/,
                    use: [ { loader: "raw-loader" } ]
                },
                {
                    test: /\.svg$/,
                    use: [
                        { loader: "raw-loader" },
                        {
                            loader: "svgo-loader",
                            options: {
                                configFile: __dirname + "/svgo.config.mjs",
                                floatPrecision: 2,
                            }
                        }
                    ]
                },
                {
                    test: /\.(png|jpg|jpeg|gif)$/,
                    use: 'url-loader?limit=25000'
                },
            ]
        },
        optimization: {
            splitChunks: splitChunks,
            minimize: !isDevBuild,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: true,
                        keep_classnames: false,
                        keep_fnames: false,
                        format: {
                            comments: false
                        },
						sourceMap: false
                    },
                    extractComments: false
                })
            ],
            removeAvailableModules: false,
            removeEmptyChunks: true,
            providedExports: false,
            usedExports: true
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: getFilePath('[name].css'),
                chunkFilename: isDevBuild ? '[id].css' : '[id].[contenthash].css',
                ignoreOrder: true
            }),
            new WebpackManifestPlugin({
                fileName: getFilePath('manifest.json'),
            }),
            new HtmlWebpackPlugin({
                filename: "index.html",
                template: path.join(frontDir, "template.html"),
                publicPath: "/"
            })
        ]
    }];
};