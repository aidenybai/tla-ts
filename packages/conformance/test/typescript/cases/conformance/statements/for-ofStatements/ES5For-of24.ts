/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of24.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of24.ts
---*/
// @target: es5, es2015
// @strict: false
var a = [1, 2, 3];
for (var v of a) {
    let a = 0;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
