/*---
description: Ported from TypeScript's tests/cases/compiler/arrowFunctionInExpressionStatement2.ts.
outcome: success
source: tests/cases/compiler/arrowFunctionInExpressionStatement2.ts
---*/
// @target: es2015
namespace M {
    () => 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
