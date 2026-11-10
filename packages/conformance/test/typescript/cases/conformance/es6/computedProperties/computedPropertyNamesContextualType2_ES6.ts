/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType2_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType2_ES6.ts
---*/
// @target: es6
interface I {
    [s: string]: (x: any) => number; // Doesn't get hit
    [s: number]: (x: string) => number;
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
