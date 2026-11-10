/*---
description: Ported from TypeScript's tests/cases/compiler/enumNegativeLiteral1.ts.
outcome: success
source: tests/cases/compiler/enumNegativeLiteral1.ts
---*/
// @target: es2015
enum E {
    a = -5, b, c
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
