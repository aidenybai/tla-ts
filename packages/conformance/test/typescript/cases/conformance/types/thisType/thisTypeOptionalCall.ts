/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeOptionalCall.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeOptionalCall.ts
---*/
// @target: es2015
// @strictNullChecks: true
// @noImplicitAny: true
// @noImplicitThis: true
// @strictBindCallApply: false

function maybeBind<T, A extends any[], R>(obj: T, fn: ((this: T, ...args: A) => R) | undefined): ((...args: A) => R) | undefined {
    return fn?.bind(obj);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
