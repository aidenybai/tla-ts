/*---
description: Ported from TypeScript's tests/cases/compiler/stripInternal1.ts.
outcome: success
source: tests/cases/compiler/stripInternal1.ts
---*/
// @target: es2015
// @declaration:true
// @stripInternal:true

class C {
  foo(): void { }
  // @internal
  bar(): void { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
