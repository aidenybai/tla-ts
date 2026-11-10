/*---
description: Ported from TypeScript's tests/cases/conformance/es2017/useObjectValuesAndEntries2.ts.
outcome: success
source: tests/cases/conformance/es2017/useObjectValuesAndEntries2.ts
---*/
// @target: es5, es2015
// @lib: es5

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
