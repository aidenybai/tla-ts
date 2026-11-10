/*---
description: Ported from TypeScript's tests/cases/compiler/noEmitHelpers.ts.
outcome: success
source: tests/cases/compiler/noEmitHelpers.ts
---*/
// @target: es2015
// @noemithelpers: true

class A { }
class B extends A { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
