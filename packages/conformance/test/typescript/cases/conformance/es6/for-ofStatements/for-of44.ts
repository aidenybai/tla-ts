/*---
description: Ported from TypeScript's tests/cases/conformance/es6/for-ofStatements/for-of44.ts.
outcome: success
source: tests/cases/conformance/es6/for-ofStatements/for-of44.ts
---*/
﻿//@target: ES6
var array: [number, string | boolean | symbol][] = [[0, ""], [0, true], [1, Symbol()]]
for (var [num, strBoolSym] of array) {
    num;
    strBoolSym;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
