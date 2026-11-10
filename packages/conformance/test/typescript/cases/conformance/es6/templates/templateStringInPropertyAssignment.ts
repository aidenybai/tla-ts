/*---
description: Ported from TypeScript's tests/cases/conformance/es6/templates/templateStringInPropertyAssignment.ts.
outcome: success
source: tests/cases/conformance/es6/templates/templateStringInPropertyAssignment.ts
---*/
﻿// @target: es2015
var x = {
    a: `abc${ 123 }def${ 456 }ghi`
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
