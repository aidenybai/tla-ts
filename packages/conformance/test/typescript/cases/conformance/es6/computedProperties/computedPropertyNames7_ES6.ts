/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames7_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames7_ES6.ts
---*/
// @target: es6
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
