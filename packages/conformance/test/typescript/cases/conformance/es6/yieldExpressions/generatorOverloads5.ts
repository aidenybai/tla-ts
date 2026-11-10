/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorOverloads5.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorOverloads5.ts
---*/
//@target: ES6
namespace M {
    function f(s: string): Iterable<any>;
    function f(s: number): Iterable<any>;
    function* f(s: any): Iterable<any> { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
