/*---
description: Ported from TypeScript's tests/cases/compiler/quotedAccessorName1.ts.
outcome: success
source: tests/cases/compiler/quotedAccessorName1.ts
---*/
// @target: es2015
class C {
    get "foo"() { return 0; }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
