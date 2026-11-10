/*---
description: Ported from TypeScript's tests/cases/compiler/captureThisInSuperCall.ts.
outcome: success
source: tests/cases/compiler/captureThisInSuperCall.ts
---*/
// @target: es2015
class A {
    constructor(p:any) {}
}

class B extends A {
    constructor() { super({ test: () => this.someMethod()}); } 
    someMethod() {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
