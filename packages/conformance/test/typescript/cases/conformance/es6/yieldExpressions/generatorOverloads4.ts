/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorOverloads4.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorOverloads4.ts
---*/
//@target: ES6
class C {
    f(s: string): Iterable<any>;
    f(s: number): Iterable<any>;
    *f(s: any): Iterable<any> { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
