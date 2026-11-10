/*---
description: Ported from TypeScript's tests/cases/compiler/sourceMapValidationLambdaSpanningMultipleLines.ts.
outcome: success
source: tests/cases/compiler/sourceMapValidationLambdaSpanningMultipleLines.ts
---*/
// @target: es2015
// @sourcemap: true
((item: string) =>
    item
)

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
