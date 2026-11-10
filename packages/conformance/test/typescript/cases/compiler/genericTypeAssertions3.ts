/*---
description: Ported from TypeScript's tests/cases/compiler/genericTypeAssertions3.ts.
outcome: success
source: tests/cases/compiler/genericTypeAssertions3.ts
---*/
// @target: es2015
// @strict: false
var r = < <T>(x: T) => T > ((x) => { return null; }); // bug was 'could not find dotted symbol T' on x's annotation in the type assertion instead of no error
var s = < <T>(x: T) => T > ((x: any) => { return null; }); // no error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
