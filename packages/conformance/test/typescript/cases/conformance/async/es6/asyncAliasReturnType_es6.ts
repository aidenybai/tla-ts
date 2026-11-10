/*---
description: Ported from TypeScript's tests/cases/conformance/async/es6/asyncAliasReturnType_es6.ts.
outcome: success
source: tests/cases/conformance/async/es6/asyncAliasReturnType_es6.ts
---*/
// @target: ES6
// @noEmitHelpers: true
type PromiseAlias<T> = Promise<T>;

async function f(): PromiseAlias<void> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
