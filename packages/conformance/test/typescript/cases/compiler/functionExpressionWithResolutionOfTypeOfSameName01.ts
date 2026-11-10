/*---
description: Ported from TypeScript's tests/cases/compiler/functionExpressionWithResolutionOfTypeOfSameName01.ts.
outcome: success
source: tests/cases/compiler/functionExpressionWithResolutionOfTypeOfSameName01.ts
---*/
﻿// @target: es2015
interface f {
}

var x = function f() {
    <f>f;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
