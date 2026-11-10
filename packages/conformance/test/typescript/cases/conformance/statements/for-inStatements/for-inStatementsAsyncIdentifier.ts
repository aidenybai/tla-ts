/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-inStatements/for-inStatementsAsyncIdentifier.ts.
outcome: success
source: tests/cases/conformance/statements/for-inStatements/for-inStatementsAsyncIdentifier.ts
---*/
// @strict: false
// @target: esnext

var async;
for (async in { a: 1, b: 2 }) {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
