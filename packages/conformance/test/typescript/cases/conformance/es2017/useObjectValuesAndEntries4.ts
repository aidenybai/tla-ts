/*---
description: Ported from TypeScript's tests/cases/conformance/es2017/useObjectValuesAndEntries4.ts.
outcome: success
source: tests/cases/conformance/es2017/useObjectValuesAndEntries4.ts
---*/
// @target: es6
// @lib: es2017

var o = { a: 1, b: 2 };

for (var x of Object.values(o)) {
    let y = x;
}

var entries = Object.entries(o);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
