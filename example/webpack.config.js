﻿"use strict";

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanCSSPlugin = require("less-plugin-clean-css");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModernBuildPlugin = require('./utils/ModernBuildPlugin');
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
            test: /\.(css|scss|less)$/, // нужно чтобы import`ы на одинаковые файла less не дублировались на выходе
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
    const isModern = process.env.BROWSERS_ENV === "modern";
	const noBrowsers = !process.env.BROWSERS_ENV;
    const prefix = isModern ? "modern" : "fallback";

    console.log(`NODE_ENV: "${process.env.NODE_ENV}"`);
    console.log(`isDevBuild: ${isDevBuild}`);

    const getFilePath = (relativePath) => path.join(prefix, relativePath);

    return [{
        mode: isDevBuild ? "development" : "production",
        entry: {
            app: path.resolve(__dirname, 'src', 'frontend', 'index.ts')
        },
        resolve: { 
			extensions: ['.js', '.jsx', '.ts', '.tsx', '.less'],
            //modules: [path.resolve(__dirname, 'node_modules')]
		},
        output: {
            path: path.join(__dirname, bundleOutputDir),
            filename: getFilePath('[name].js'),
            chunkFilename: isDevBuild ? getFilePath('[name].js') : getFilePath('[name].[contenthash].js'),
            iife: true,
            clean: noBrowsers || process.env.BROWSERS_ENV === "fallback",
            publicPath: './'
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
					include: /pages/,
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
            ...((isModern || noBrowsers) ? [
                new HtmlWebpackPlugin({
                    filename: "index.html",
                    template: path.join(frontDir, "template.html"),
                    publicPath:"./"
                }),
				...(isModern ? [ new ModernBuildPlugin(path.join(__dirname, bundleOutputDir, "fallback")) ] : [])
            ] : [])
        ]
    }];
};