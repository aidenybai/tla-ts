/*---
description: Ported from TypeScript's tests/cases/compiler/functionExpressionWithResolutionOfTypeOfSameName02.ts.
outcome: success
source: tests/cases/compiler/functionExpressionWithResolutionOfTypeOfSameName02.ts
---*/
﻿// @target: es2015
interface Foo {
}

var x = function Foo() {
    var x: Foo;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
