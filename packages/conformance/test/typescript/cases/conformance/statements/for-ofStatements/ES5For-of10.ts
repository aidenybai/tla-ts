/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of10.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of10.ts
---*/
// @target: es5, es2015
function foo() {
    return { x: 0 };
}
for (foo().x of []) {
    for (foo().x of [])
        var p = foo().x;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
