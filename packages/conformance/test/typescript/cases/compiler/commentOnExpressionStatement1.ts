/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnExpressionStatement1.ts.
outcome: success
source: tests/cases/compiler/commentOnExpressionStatement1.ts
---*/
// @target: es2015
// @removeComments: false

1 + 1; // Comment.

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
