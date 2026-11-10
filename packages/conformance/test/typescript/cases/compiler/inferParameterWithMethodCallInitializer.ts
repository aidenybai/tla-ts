/*---
description: Ported from TypeScript's tests/cases/compiler/inferParameterWithMethodCallInitializer.ts.
outcome: success
source: tests/cases/compiler/inferParameterWithMethodCallInitializer.ts
---*/
// @target: es2015
// @noImplicitAny: true
function getNumber(): number {
    return 1;
}
class Example {
    getNumber(): number {
        return 1;
    }
    doSomething(a = this.getNumber()): typeof a {
        return a;
    }
}
function weird(this: Example, a = this.getNumber()) {
    return a;
}
class Weird {
    doSomething(this: Example, a = this.getNumber()) {
        return a;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
