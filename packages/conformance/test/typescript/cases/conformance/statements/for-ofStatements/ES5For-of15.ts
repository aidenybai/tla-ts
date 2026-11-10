/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of15.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of15.ts
---*/
// @target: es5, es2015
// @strict: false
for (let v of []) {
    v;
    for (const v of []) {
        var x = v;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
