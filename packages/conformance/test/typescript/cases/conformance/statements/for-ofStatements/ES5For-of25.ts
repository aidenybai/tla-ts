/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of25.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of25.ts
---*/
// @target: es5, es2015
// @strict: false
//@sourcemap: true
var a = [1, 2, 3];
for (var v of a) {
    v;
    a;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
