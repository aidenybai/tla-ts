/*---
description: Ported from TypeScript's tests/cases/compiler/staticInstanceResolution2.ts.
outcome: success
source: tests/cases/compiler/staticInstanceResolution2.ts
---*/
// @target: es2015
class A { }
A.hasOwnProperty('foo');

class B {
    constructor() { }
}
B.hasOwnProperty('foo');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
