const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');
// Safari 10.1 не поддерживает атрибут nomodule.
// Эта переменная содержит фикс для Safari в виде строки.
// Найти фикс можно тут:
// https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc
const safariFix = `!function(){var e=document,t=e.createElement("script");if(!("noModule"in t)&&"onbeforeload"in t){var n=!1;e.addEventListener("beforeload",function(e){if(e.target===t)n=!0;else if(!e.target.hasAttribute("nomodule")||!n)return;e.preventDefault()},!0),t.type="module",t.src=".",e.head.appendChild(t),t.remove()}}();`;

class ModernBuildPlugin {
    __fallbackPath;

    constructor (fallbackPath) {
        this.__fallbackPath = fallbackPath;
    }

    apply(compiler) {
        const pluginName = 'modern-build-plugin';

        // Получаем информацию о Fallback Build
        const fallbackManifest = require(path.resolve(this.__fallbackPath, "manifest.json"));
        
        compiler.hooks.compilation.tap(pluginName, (compilation) => {
            HtmlWebpackPlugin.getHooks(compilation).alterAssetTags.tapAsync(pluginName, (data, cb) => {

                // Добавляем type="module" для modern-файлов
                data.assetTags.scripts.forEach((tag) => {
                    if (tag.attributes)
                        tag.attributes.type = 'module';
                });

                // Вставляем фикс для Safari
                data.assetTags.scripts.push({
					tagName: 'script',
					closeTag: true,
					innerHTML: safariFix,
                });

                // Вставляем fallback-файлы с атрибутом nomodule
                const legacyAsset = {
                    tagName: 'script',
                    closeTag: true,
                    attributes: {
                        src: fallbackManifest['app.js'],
                        nomodule: true,
                        defer: true,
                    },
                };
                data.assetTags.scripts.push(legacyAsset);

                cb();
            });
        });
    }
}

module.exports = ModernBuildPlugin;