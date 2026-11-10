/*---
description: Ported from TypeScript's tests/cases/compiler/simpleArrowFunctionParameterReferencedInObjectLiteral1.ts.
outcome: success
source: tests/cases/compiler/simpleArrowFunctionParameterReferencedInObjectLiteral1.ts
---*/
// @target: es2015
[].map(() => [].map(p => ({ X: p })));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
