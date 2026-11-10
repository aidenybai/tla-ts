/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames7_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames7_ES5.ts
---*/
// @target: es5, es2015
enum E {
    member
}
var v = {
    [E.member]: 0
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
