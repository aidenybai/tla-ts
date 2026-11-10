/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of21.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of21.ts
---*/
// @target: es5, es2015
// @strict: false
for (let v of []) {
    for (let _i of []) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
