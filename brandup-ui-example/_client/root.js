var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
define(["require", "exports", "brandup-ui", "./styles.less"], function (require, exports, brandup_ui_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Elem = /** @class */ (function (_super) {
        __extends(Elem, _super);
        function Elem() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Object.defineProperty(Elem.prototype, "typeName", {
            get: function () { return "Elem2"; },
            enumerable: true,
            configurable: true
        });
        Elem.prototype._onRender = function () {
        };
        return Elem;
    }(brandup_ui_1.UIControl));
    exports.Elem = Elem;
    var elem = new Elem(null, document.body);
});
//# sourceMappingURL=root.js.map