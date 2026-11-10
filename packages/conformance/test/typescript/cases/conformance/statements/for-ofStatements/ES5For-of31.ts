/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-of31.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-of31.ts
---*/
// @target: es5, es2015
var a: string, b: number;

for ({ a: b = 1, b: a = ""} of []) {
    a;
    b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
