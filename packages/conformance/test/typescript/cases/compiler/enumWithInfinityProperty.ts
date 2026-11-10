/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithInfinityProperty.ts.
outcome: success
source: tests/cases/compiler/enumWithInfinityProperty.ts
---*/
// @target: es2015
enum A {
    Infinity = 1
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
