/*---
description: Ported from TypeScript's tests/cases/compiler/narrowingWithNonNullExpression.ts.
outcome: success
source: tests/cases/compiler/narrowingWithNonNullExpression.ts
---*/
// @target: es2015
const m = ''.match('');
m! && m[0];
m?.[0]! && m[0];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
