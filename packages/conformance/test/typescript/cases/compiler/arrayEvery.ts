/*---
description: Ported from TypeScript's tests/cases/compiler/arrayEvery.ts.
outcome: success
source: tests/cases/compiler/arrayEvery.ts
---*/
// @target: es2015
const foo: (number | string)[] = ['aaa'];

const isString = (x: unknown): x is string => typeof x === 'string';

if (foo.every(isString)) {
  foo[0].slice(0);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
