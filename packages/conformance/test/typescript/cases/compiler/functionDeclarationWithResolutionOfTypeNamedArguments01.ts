/*---
description: Ported from TypeScript's tests/cases/compiler/functionDeclarationWithResolutionOfTypeNamedArguments01.ts.
outcome: success
source: tests/cases/compiler/functionDeclarationWithResolutionOfTypeNamedArguments01.ts
---*/
﻿// @target: es2015
interface arguments {
}

function f() {
    <arguments>arguments;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
