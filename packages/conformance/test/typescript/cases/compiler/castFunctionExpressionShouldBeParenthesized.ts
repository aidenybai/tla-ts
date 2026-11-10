/*---
description: Ported from TypeScript's tests/cases/compiler/castFunctionExpressionShouldBeParenthesized.ts.
outcome: throws
source: tests/cases/compiler/castFunctionExpressionShouldBeParenthesized.ts
---*/
// @target: es2015
(function a() { } as any)().foo()

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
