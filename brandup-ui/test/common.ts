import { expect, assert } from 'chai';

import * as common from "../src/common";

var div: HTMLDivElement;

beforeEach(function () {
    div = <HTMLDivElement>document.getElementById("amtTest");
    if (div) {
        div.innerHTML = "";
    }
    else {
        div = document.createElement("div");
        div.id = "amtTest";
        document.body.appendChild(div);
    }
});

describe('#Utility', () => {
    it('isString return true', () => {
        var str = "test";

        var result = common.Utility.isString(str);
        
        expect(result).eq(true);
    });

    it('isString return false', () => {
        var str = 1;

        var result = common.Utility.isString(str);

        expect(result).eq(false);
    });
});