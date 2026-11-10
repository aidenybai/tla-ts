/*---
description: Ported from TypeScript's tests/cases/conformance/es6/computedProperties/computedPropertyNames47_ES5.ts.
outcome: success
source: tests/cases/conformance/es6/computedProperties/computedPropertyNames47_ES5.ts
---*/
// @target: es5, es2015
enum E1 { x }
enum E2 { x }
var o = {
    [E1.x || E2.x]: 0
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
