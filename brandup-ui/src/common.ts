export class Utility {
    static arrayToObject(array: Array<{ Key: string; Value: any }>): any {
        if (array) {
            var result = {};
            for (var i = 0; i < array.length; i++) {
                result[array[i].Key] = array[i].Value;
            }
            return result;
        }
        return null;
    }

    static objectToArray(obj: any): Array<{ Key: string; Value: any }> | null {
        if (obj) {
            var result = new Array<{ Key: string; Value: any }>();
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result.push({ Key: key, Value: obj[key] });
                }
            }
            return result;
        }
        return null;
    }

    static getWordEnd(count: number, word: string, one?: string, two?: string, five?: string): string {
        var tt = count % 100;
        if (tt >= 5 && tt <= 20) {
            return word + (Utility.isString(five) ? five : "");
        }

        var t = count % 10;

        return (t === 1 ?
            (word + (Utility.isString(one) ? one : "")) :
            (
                (t >= 2 && t <= 4) ?
                    (word + (Utility.isString(two) ? two : "")) :
                    (word + (Utility.isString(five) ? five : "")
                    )
            )
        );
    }

    static isString(value: any) {
        return (typeof value === "string" || value instanceof String);
    }

    static isArray(value: any) {
        return (value instanceof Array);
    }

    static isUndefined(value: any) {
        return (typeof value === "undefined");
    }

    static isFunction(value: any) {
        return (typeof value === "function");
    }
    static isPlainObject(obj: any): boolean {
        if (!obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval) {
            return false;
        }

        if (obj.constructor && !obj.hasOwnProperty.call(obj, "constructor") && !obj.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }

        var key;
        for (key in obj) { }

        return key === undefined || obj.hasOwnProperty.call(obj, key);
    }

    static joinString(separator: string, items: Array<any>): string {
        if (!Utility.isArray(items))
            throw "Param items is not array.";

        var str = "";
        for (var i = 0; i < items.length; i++)
            str += (i > 0 ? separator : "") + items[i];

        return str;
    }

    static stringIsNullOrEmpty(str: string): boolean {
        return !Utility.isString(str) || str === null || str === "";
    }

    static hasProperty(obj: any, property: string): boolean {
        if (obj === null || Utility.isUndefined(obj) || !Utility.isString(property)) {
            return false;
        }

        var props: Array<string> = (property.indexOf(".") >= 0 ? property.split(".") : [property]);

        var t = obj;
        for (var i = 0; i < props.length; i++) {
            if (!t) {
                return false;
            }
            var pName = props[i];
            if (!t.hasOwnProperty(pName)) {
                return false;
            }

            t = t[pName];
        }

        return true;
    }

    static getProperty(obj: any, property: string): any {
        if (obj === null || Utility.isUndefined(obj) || !Utility.isString(property)) {
            return null;
        }

        var props: Array<string> = (property.indexOf(".") >= 0 ? property.split(".") : [property]);

        var t = obj;
        for (var i = 0; i < props.length; i++) {
            var pName = props[i];
            if (!t.hasOwnProperty(pName)) {
                return null;
            }

            t = t[pName];
        }

        return t;
    }

    static extend(...params: any[]): any {
        var options, name, src, copy, copyIsArray, clone,
            target = params[0] || {},
            i = 1,
            length = params.length,
            deep = true;

        if (typeof target !== "object" && !Utility.isFunction(target)) {
            target = {};
        }

        if (length === i) {
            //target = this;
            --i;
        }

        for (; i < length; i++) {
            if ((options = params[i]) != null) {
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    if (target === copy) {
                        continue;
                    }

                    if (deep && copy && (Utility.isPlainObject(copy) || (copyIsArray = Utility.isArray(copy)))) {
                        if (copyIsArray) {
                            copyIsArray = false;
                            clone = src && Utility.isArray(src) ? src : [];

                        } else {
                            clone = src && Utility.isPlainObject(src) ? src : {};
                        }

                        target[name] = Utility.extend(clone, copy);
                    } else if (copy !== undefined) {
                        target[name] = copy;
                    }
                }
            }
        }

        return target;
    }

    static createDelegate(context: any, func: (...params: Array<any>) => void) {
        return (...params: Array<any>) => func.apply(context, params);
    }
    static createDelegate2(context: any, func: (...params: Array<any>) => void, args?: Array<any>) {
        return (...params: Array<any>) => {
            var args2 = new Array<any>();
            if (args && args.length) {
                for (var i = 0; i < args.length; i++) {
                    args2.push(args[i]);
                }
            }
            if (params.length) {
                for (var i = 0; i < params.length; i++) {
                    args2.push(params[i]);
                }
            }
            return func.apply(context, args2);
        };
    }
    static createDelegate3(context: any, func: (...params: Array<any>) => void, args?: Array<any>) {
        return (...params: Array<any>) => {
            var args2 = new Array<any>();
            if (params.length) {
                for (var i = 0; i < params.length; i++) {
                    args2.push(params[i]);
                }
            }
            if (args && args.length) {
                for (var i = 0; i < args.length; i++) {
                    args2.push(args[i]);
                }
            }
            return func.apply(context, args2);
        };
    };
}