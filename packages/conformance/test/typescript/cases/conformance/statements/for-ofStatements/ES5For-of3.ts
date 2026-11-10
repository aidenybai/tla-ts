/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of3.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of3.ts
---*/
// @target: es5, es2015
//@sourcemap: true
for (var v of ['a', 'b', 'c'])
    var x = v;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
