/*---
description: Ported from TypeScript's tests/cases/conformance/async/es5/asyncAliasReturnType_es5.ts.
outcome: success
source: tests/cases/conformance/async/es5/asyncAliasReturnType_es5.ts
---*/
// @target: ES5, ES2015
// @lib: es5,es2015.promise
// @noEmitHelpers: true
type PromiseAlias<T> = Promise<T>;

async function f(): PromiseAlias<void> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
