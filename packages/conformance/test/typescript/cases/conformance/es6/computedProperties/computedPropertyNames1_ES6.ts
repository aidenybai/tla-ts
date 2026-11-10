/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames1_ES6.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames1_ES6.ts
---*/
// @target: es6
var v = {
    get [0 + 1]() { return 0 },
    set [0 + 1](v: string) { } //No error
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
