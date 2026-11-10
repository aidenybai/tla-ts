/*---
description: Ported from TypeScript's tests/cases/compiler/quotedAccessorName2.ts.
outcome: success
source: tests/cases/compiler/quotedAccessorName2.ts
---*/
// @target: es2015
class C {
    static get "foo"() { return 0; }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
