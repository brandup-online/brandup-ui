export declare class Utility {
    static arrayToObject(array: Array<{
        Key: string;
        Value: any;
    }>): any;
    static objectToArray(obj: any): Array<{
        Key: string;
        Value: any;
    }> | null;
    static getWordEnd(count: number, word: string, one?: string, two?: string, five?: string): string;
    static isString(value: any): boolean;
    static isArray(value: any): boolean;
    static isUndefined(value: any): boolean;
    static isFunction(value: any): boolean;
    static isPlainObject(obj: any): boolean;
    static joinString(separator: string, items: Array<any>): string;
    static stringIsNullOrEmpty(str: string): boolean;
    static hasProperty(obj: any, property: string): boolean;
    static getProperty(obj: any, property: string): any;
    static extend(...params: any[]): any;
    static createDelegate(context: any, func: (...params: Array<any>) => void): (...params: any[]) => any;
    static createDelegate2(context: any, func: (...params: Array<any>) => void, args?: Array<any>): (...params: any[]) => any;
    static createDelegate3(context: any, func: (...params: Array<any>) => void, args?: Array<any>): (...params: any[]) => any;
}
