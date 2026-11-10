/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/privateNames/privateNameES5Ban.ts.
outcome: success
source: tests/cases/conformance/classes/members/privateNames/privateNameES5Ban.ts
---*/
// @target: es5, es2015

class A {
    constructor() {}
    #field = 123;
    #method() {}
    static #sField = "hello world";
    static #sMethod() {}
    get #acc() { return ""; }
    set #acc(x: string) {}
    static get #sAcc() { return 0; }
    static set #sAcc(x: number) {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
