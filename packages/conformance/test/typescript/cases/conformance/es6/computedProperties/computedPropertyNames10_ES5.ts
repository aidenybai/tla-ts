/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames10_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames10_ES5.ts
---*/
// @target: es5, es2015
var s: string;
var n: number;
var a: any;
var v = {
    [s]() { },
    [n]() { },
    [s + s]() { },
    [s + n]() { },
    [+s]() { },
    [""]() { },
    [0]() { },
    [a]() { },
    [<any>true]() { },
    [`hello bye`]() { },
    [`hello ${a} bye`]() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
