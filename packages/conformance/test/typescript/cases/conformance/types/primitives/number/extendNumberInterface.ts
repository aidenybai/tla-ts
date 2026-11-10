/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/number/extendNumberInterface.ts.
outcome: throws
source: tests/cases/conformance/types/primitives/number/extendNumberInterface.ts
---*/
// @target: es2015
interface Number {
    doStuff(): string;
    doOtherStuff<T>(x:T): T;
}

var x = 1;
var a: string = x.doStuff();
var b: string = x.doOtherStuff('hm');
var c: string = x['doStuff']();
var d: string = x['doOtherStuff']('hm');

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
