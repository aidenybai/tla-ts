/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithNegativeInfinityProperty.ts.
outcome: success
source: tests/cases/compiler/enumWithNegativeInfinityProperty.ts
---*/
// @target: es2015
enum A {
    "-Infinity" = 1
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
