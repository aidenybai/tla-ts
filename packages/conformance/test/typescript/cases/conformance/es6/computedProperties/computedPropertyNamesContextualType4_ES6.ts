/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType4_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNamesContextualType4_ES6.ts
---*/
// @target: es6
interface I {
    [s: string]: any;
    [s: number]: any;
}

var o: I = {
    [""+"foo"]: "",
    [""+"bar"]: 0
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
