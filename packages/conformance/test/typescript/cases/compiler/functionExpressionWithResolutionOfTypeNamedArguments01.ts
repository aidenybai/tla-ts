/*---
description: Ported from TypeScript's tests/cases/compiler/functionExpressionWithResolutionOfTypeNamedArguments01.ts.
outcome: success
source: tests/cases/compiler/functionExpressionWithResolutionOfTypeNamedArguments01.ts
---*/
﻿// @target: es2015
interface arguments {
}

var x = function f() {
    <arguments>arguments;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
