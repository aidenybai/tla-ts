/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType3_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType3_ES5.ts
---*/
// @target: es5, es2015
interface I {
    [s: string]: (x: string) => number;
}

var o: I = {
    [+"foo"](y) { return y.length; },
    [+"bar"]: y => y.length
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
