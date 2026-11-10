/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of6.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of6.ts
---*/
// @target: es5, es2015
// @strict: false
for (var w of []) {
    for (var v of []) {
        var x = [w, v];
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
