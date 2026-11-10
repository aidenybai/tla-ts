/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5For-ofTypeCheck13.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5For-ofTypeCheck13.ts
---*/
//@target: ES5, ES2015
//@lib: ES6
const strSet: Set<string> = new Set()
strSet.add('Hello')
strSet.add('World')
for (const str of strSet) { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
