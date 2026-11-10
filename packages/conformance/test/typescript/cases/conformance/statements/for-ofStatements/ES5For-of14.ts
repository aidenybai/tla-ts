/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of14.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of14.ts
---*/
// @target: es5, es2015
// @strict: false
for (const v of []) {
    var x = v;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
