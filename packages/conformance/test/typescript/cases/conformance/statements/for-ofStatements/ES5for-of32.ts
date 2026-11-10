/*---
description: Ported from TypeScript's tests/cases/conformance/statements/for-ofStatements/ES5for-of32.ts.
outcome: success
source: tests/cases/conformance/statements/for-ofStatements/ES5for-of32.ts
---*/
//@target: ES5, ES2015

var array = [1,2,3];
var sum = 0;

for (let num of array) {
    if (sum === 0) {
        array = [4,5,6]
    }
    
    sum += num;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
