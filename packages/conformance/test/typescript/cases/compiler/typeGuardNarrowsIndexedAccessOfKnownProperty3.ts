/*---
description: Ported from TypeScript's tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty3.ts.
outcome: success
source: tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty3.ts
---*/
// @target: es2015
// @strict: true

type Foo = (number | undefined)[] | undefined;

const foo: Foo = [1, 2, 3];
const index = 1;

if (foo !== undefined && foo[index] !== undefined && foo[index] >= 0) {
    foo[index] // number
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
