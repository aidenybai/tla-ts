/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames13_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames13_ES5.ts
---*/
// @target: es5, es2015
var s: string;
var n: number;
var a: any;
class C {
    [s]() {}
    [n]() { }
    static [s + s]() { }
    [s + n]() { }
    [+s]() { }
    static [""]() { }
    [0]() { }
    [a]() { }
    static [<any>true]() { }
    [`hello bye`]() { }
    static [`hello ${a} bye`]() { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
