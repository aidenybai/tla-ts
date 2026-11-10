/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/thisKeyword/typeOfThisInConstructorParamList.ts.
outcome: success
source: tests/cases/conformance/expressions/thisKeyword/typeOfThisInConstructorParamList.ts
---*/
// @target: es2015
//type of 'this' in constructor param list is the class instance type (error)
class ErrClass {
    // Should be an error
    constructor(f = this) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
