/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithNaNProperty.ts.
outcome: success
source: tests/cases/compiler/enumWithNaNProperty.ts
---*/
// @target: es2015
enum A {
    NaN = 1
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
