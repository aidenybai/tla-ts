/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInPropertyAssignmentES6.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInPropertyAssignmentES6.ts
---*/
﻿// @target: ES6
var x = {
    a: `abc${ 123 }def${ 456 }ghi`
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
