/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-ofTypeCheck3.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-ofTypeCheck3.ts
---*/
//@target: ES5, ES2015
var tuple: [string, number] = ["", 0];
for (var v of tuple) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
