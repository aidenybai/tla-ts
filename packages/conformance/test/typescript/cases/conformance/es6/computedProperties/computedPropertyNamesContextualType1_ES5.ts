/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType1_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType1_ES5.ts
---*/
// @target: es5, es2015
interface I {
    [s: string]: (x: string) => number;
    [s: number]: (x: any) => number; // Doesn't get hit
}

var o: I = {
    ["" + 0](y) { return y.length; },
    ["" + 1]: y => y.length
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
