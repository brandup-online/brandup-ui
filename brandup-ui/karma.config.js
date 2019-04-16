var webpackConfig = require('./webpack.test.js');

module.exports = function (config) {
    var configuration = {
        basePath: './',
        browserNoActivityTimeout: 30000,
        frameworks: ["mocha", "chai", "karma-typescript"],
        files: [
            "test/common.ts",
            "src/ajax.ts",
            "src/common.ts",
            "src/control.ts",
            "src/dom.ts",
            "src/element.ts"
        ],
        preprocessors: {
            'src/ajax.ts': ['karma-typescript', "sourcemap", "coverage"],
            'src/common.ts': ['karma-typescript', "sourcemap", "coverage"],
            'src/control.ts': ['karma-typescript', "sourcemap", "coverage"],
            'src/dom.ts': ['karma-typescript', "sourcemap", "coverage"],
            'src/element.ts': ['karma-typescript', "sourcemap", "coverage"],
            "test/common.ts": ['karma-typescript', "sourcemap"]

        },
        webpack: webpackConfig,
        webpackMiddleware: {
            stats: "errors-only"
        },
        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },
        reporters: ["progress", 'coverage', "karma-typescript"],
        coverageReporter: {
            dir: 'coverage',
            subdir: '.',
            reporters: [{ type: 'lcov', dir: 'coverage/' }]
        },
        browsers: ["Chrome", "Firefox"],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        singleRun: true,
        concurrency: Infinity,
        plugins: [
            require("karma-mocha"),
            require("karma-chai"),
            require("karma-webpack"),
            require("karma-coverage"),
            require("karma-chrome-launcher"),
            require("karma-firefox-launcher"),
            require("karma-sourcemap-loader"),
            require("istanbul-instrumenter-loader"),
            require("karma-typescript")
        ]
    };
    
    config.set(configuration);
};