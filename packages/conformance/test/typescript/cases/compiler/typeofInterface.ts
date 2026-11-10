/*---
description: Ported from TypeScript's tests/cases/compiler/typeofInterface.ts.
outcome: success
source: tests/cases/compiler/typeofInterface.ts
---*/
// @target: es2015
var I: { a: string};

interface I {
    I: number;
    foo: typeof I;
}

var k: I;
var j: typeof k.foo = { a: "hello" };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
