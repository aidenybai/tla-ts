/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of19.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of19.ts
---*/
// @target: es5, es2015
// @ignoreDeprecations: 6.0
// @strict: false
// @alwaysStrict: true, false
for (let v of []) {
    v;
    function foo() {
        for (const v of []) {
            v;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
