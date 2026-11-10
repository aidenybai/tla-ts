/*---
description: Ported from TypeScript's tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty2.ts.
outcome: success
source: tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty2.ts
---*/
// @target: es2015
// @strict: true

const foo: { key?: number } = {};
const key = 'key' as const;

if (foo[key]) {
    foo[key]; // number
    foo.key;  // number
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
